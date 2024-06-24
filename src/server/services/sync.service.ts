import { getDb } from "../db/database.ts";
import {
  getAudioFeatures,
  getArtistsByIds,
  getRecentlyPlayed,
} from "./spotify.service.ts";
import { getValidAccessToken } from "./token.store.ts";

// Pulls "recently played" from Spotify and tucks anything new into SQLite.
// It's incremental: we only ask for plays after the last one we already have.

interface RecentItem {
  played_at: string;
  track: {
    id: string;
    name: string;
    duration_ms: number;
    popularity: number;
    preview_url: string | null;
    album: { id: string; name: string; images?: { url: string }[] };
    artists: { id: string; name: string }[];
  };
  context?: { type?: string; uri?: string } | null;
}

export interface SyncResult {
  ok: boolean;
  tracksAdded: number;
  message: string;
}

export async function syncRecentlyPlayed(): Promise<SyncResult> {
  const token = await getValidAccessToken();
  if (!token) {
    return { ok: false, tracksAdded: 0, message: "Not connected to Spotify yet." };
  }

  const db = getDb();
  const lastRow = db
    .prepare("SELECT played_at FROM play_history ORDER BY played_at DESC LIMIT 1")
    .get() as { played_at: string } | undefined;
  const after = lastRow ? new Date(lastRow.played_at).getTime() : undefined;

  const recent = await getRecentlyPlayed(token);
  const items = (recent.items as RecentItem[]).filter(
    (i) => !after || new Date(i.played_at).getTime() > after,
  );

  const insTrack = db.prepare(
    `INSERT INTO tracks (id, name, artist_ids, album_id, album_name, duration_ms, popularity, preview_url, image_url)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO NOTHING`,
  );
  const insPlay = db.prepare(
    "INSERT INTO play_history (track_id, played_at, context_type, context_uri) VALUES (?, ?, ?, ?)",
  );

  const newArtistIds = new Set<string>();
  const newTrackIds = new Set<string>();
  for (const item of items) {
    const t = item.track;
    insTrack.run(
      t.id, t.name, t.artists.map((a) => a.id).join(","), t.album.id, t.album.name,
      t.duration_ms, t.popularity, t.preview_url, t.album.images?.[0]?.url ?? null,
    );
    insPlay.run(t.id, item.played_at, item.context?.type ?? null, item.context?.uri ?? null);
    newTrackIds.add(t.id);
    for (const a of t.artists) newArtistIds.add(a.id);
  }

  await hydrateArtists(token, [...newArtistIds]);
  await hydrateAudioFeatures(token, [...newTrackIds]);

  db.prepare("INSERT INTO sync_log (synced_at, tracks_added, cursor) VALUES (?, ?, ?)").run(
    new Date().toISOString(), items.length, recent.cursors?.before ?? null,
  );

  return {
    ok: true,
    tracksAdded: items.length,
    message: items.length
      ? `Saved ${items.length} new play${items.length === 1 ? "" : "s"}.`
      : "All caught up — nothing new since last time.",
  };
}

async function hydrateArtists(token: string, ids: string[]): Promise<void> {
  if (!ids.length) return;
  const db = getDb();
  const ins = db.prepare(
    `INSERT INTO artists (id, name, genres, popularity, image_url) VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET genres = excluded.genres, popularity = excluded.popularity`,
  );
  for (let i = 0; i < ids.length; i += 50) {
    const batch = ids.slice(i, i + 50);
    const data = (await getArtistsByIds(token, batch)).artists as {
      id: string; name: string; genres: string[]; popularity: number; images?: { url: string }[];
    }[];
    for (const a of data) {
      ins.run(a.id, a.name, (a.genres ?? []).join(","), a.popularity ?? null, a.images?.[0]?.url ?? null);
    }
  }
}

async function hydrateAudioFeatures(token: string, ids: string[]): Promise<void> {
  if (!ids.length) return;
  const db = getDb();
  const ins = db.prepare(
    `INSERT INTO audio_features (track_id, danceability, energy, key, loudness, mode, speechiness, acousticness, instrumentalness, liveness, valence, tempo, time_signature)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(track_id) DO NOTHING`,
  );
  for (let i = 0; i < ids.length; i += 100) {
    const batch = ids.slice(i, i + 100);
    const data = (await getAudioFeatures(token, batch)).audio_features as ({
      id: string; danceability: number; energy: number; key: number; loudness: number;
      mode: number; speechiness: number; acousticness: number; instrumentalness: number;
      liveness: number; valence: number; tempo: number; time_signature: number;
    } | null)[];
    for (const f of data) {
      if (!f) continue;
      ins.run(
        f.id, f.danceability, f.energy, f.key, f.loudness, f.mode, f.speechiness,
        f.acousticness, f.instrumentalness, f.liveness, f.valence, f.tempo, f.time_signature,
      );
    }
  }
}
