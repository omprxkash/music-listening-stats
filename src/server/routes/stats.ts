import { Router } from "express";
import { getDb } from "../db/database.ts";
import {
  type AudioFeatureRow,
  type PlayRow,
  aggregateGenres,
  averageAudioFeatures,
  computePersonality,
  listeningHeatmap,
  peakListeningHour,
  summarize,
} from "../services/stats.service.ts";

export const statsRouter = Router();

interface JoinedPlay extends PlayRow {
  track_id: string;
  track_name: string;
  artist_ids: string;
  album_name: string | null;
  image_url: string | null;
}

function loadPlays(): JoinedPlay[] {
  return getDb()
    .prepare(
      `SELECT ph.played_at, t.id AS track_id, t.name AS track_name, t.artist_ids,
              t.album_name, t.duration_ms, t.image_url
       FROM play_history ph
       JOIN tracks t ON t.id = ph.track_id`,
    )
    .all() as unknown as JoinedPlay[];
}

function artistsById(): Map<string, { id: string; name: string; genres: string }> {
  const rows = getDb().prepare("SELECT id, name, genres FROM artists").all() as {
    id: string; name: string; genres: string | null;
  }[];
  const map = new Map<string, { id: string; name: string; genres: string }>();
  for (const r of rows) map.set(r.id, { id: r.id, name: r.name, genres: r.genres ?? "" });
  return map;
}

function primaryArtistId(artistIds: string): string {
  return artistIds.split(",")[0]?.trim() ?? "";
}

function featuresByTrack(): Map<string, AudioFeatureRow> {
  const rows = getDb()
    .prepare(
      `SELECT track_id, danceability, energy, valence, acousticness,
              instrumentalness, speechiness, liveness, tempo
       FROM audio_features`,
    )
    .all() as unknown as (AudioFeatureRow & { track_id: string })[];
  const map = new Map<string, AudioFeatureRow>();
  for (const r of rows) map.set(r.track_id, r);
  return map;
}

statsRouter.get("/top-artists", (req, res) => {
  const limit = clampLimit(req.query.limit, 10);
  const plays = loadPlays();
  const artists = artistsById();
  const counts = new Map<string, number>();
  for (const p of plays) {
    const id = primaryArtistId(p.artist_ids);
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  const result = [...counts.entries()]
    .map(([id, playCount]) => ({
      id,
      name: artists.get(id)?.name ?? "Unknown artist",
      genres: (artists.get(id)?.genres ?? "").split(",").filter(Boolean),
      playCount,
    }))
    .sort((a, b) => b.playCount - a.playCount)
    .slice(0, limit);
  res.json(result);
});

statsRouter.get("/top-tracks", (req, res) => {
  const limit = clampLimit(req.query.limit, 10);
  const plays = loadPlays();
  const artists = artistsById();
  const counts = new Map<string, { play: JoinedPlay; n: number }>();
  for (const p of plays) {
    const entry = counts.get(p.track_id);
    if (entry) entry.n++;
    else counts.set(p.track_id, { play: p, n: 1 });
  }
  const result = [...counts.values()]
    .map(({ play, n }) => ({
      id: play.track_id,
      name: play.track_name,
      artist: artists.get(primaryArtistId(play.artist_ids))?.name ?? "Unknown artist",
      album: play.album_name,
      playCount: n,
    }))
    .sort((a, b) => b.playCount - a.playCount)
    .slice(0, limit);
  res.json(result);
});

statsRouter.get("/listening-heatmap", (_req, res) => {
  res.json(listeningHeatmap(loadPlays()));
});

statsRouter.get("/genre-distribution", (_req, res) => {
  const plays = loadPlays();
  const artists = artistsById();
  const genreLists = plays.map((p) => {
    const a = artists.get(primaryArtistId(p.artist_ids));
    return a ? a.genres.split(",").filter(Boolean) : [];
  });
  res.json(aggregateGenres(genreLists));
});

statsRouter.get("/audio-features-avg", (_req, res) => {
  res.json(averageAudioFeatures(playFeatures()));
});

statsRouter.get("/personality", (_req, res) => {
  const plays = loadPlays();
  res.json(computePersonality(averageAudioFeatures(playFeatures()), peakListeningHour(plays)));
});

statsRouter.get("/summary", (_req, res) => {
  const plays = loadPlays();
  const artists = artistsById();
  const uniqueArtists = new Set(plays.map((p) => primaryArtistId(p.artist_ids))).size;
  const genreLists = plays.map((p) => {
    const a = artists.get(primaryArtistId(p.artist_ids));
    return a ? a.genres.split(",").filter(Boolean) : [];
  });
  const genres = aggregateGenres(genreLists);
  const avg = averageAudioFeatures(playFeatures());
  res.json(summarize(plays, uniqueArtists, genres, avg));
});

// Build the per-play feature list once (each play contributes its track's
// features, so the songs you spin most pull the averages their way).
function playFeatures(): AudioFeatureRow[] {
  const plays = loadPlays();
  const features = featuresByTrack();
  const out: AudioFeatureRow[] = [];
  for (const p of plays) {
    const f = features.get(p.track_id);
    if (f) out.push(f);
  }
  return out;
}

function clampLimit(raw: unknown, fallback: number): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.min(Math.floor(n), 50);
}
