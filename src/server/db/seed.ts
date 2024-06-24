import type { DatabaseSync } from "node:sqlite";
import { getDb, resetTables } from "./database.ts";

// A believable pretend listening history so the dashboard has something real to
// chew on without anyone needing Spotify keys. It's seeded from a fixed number
// so the charts look the same every time you run it — handy for screenshots.

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type SeedArtist = { id: string; name: string; genres: string; popularity: number };
type SeedTrack = {
  id: string;
  name: string;
  artistId: string;
  album: string;
  durationMs: number;
  popularity: number;
  weight: number; // how often it shows up in the history
  f: AudioFeatureTuple;
};

// danceability, energy, valence, acousticness, instrumentalness, speechiness, tempo
type AudioFeatureTuple = [number, number, number, number, number, number, number];

const ARTISTS: SeedArtist[] = [
  { id: "ar_tame", name: "Tame Impala", genres: "psychedelic rock,indie,neo-psychedelia", popularity: 84 },
  { id: "ar_daft", name: "Daft Punk", genres: "electronic,french house,dance", popularity: 82 },
  { id: "ar_radio", name: "Radiohead", genres: "alternative rock,art rock", popularity: 80 },
  { id: "ar_bon", name: "Bon Iver", genres: "indie folk,folk", popularity: 74 },
  { id: "ar_odesza", name: "ODESZA", genres: "electronic,future bass,chillwave", popularity: 71 },
  { id: "ar_nujabes", name: "Nujabes", genres: "lo-fi,jazz hop", popularity: 68 },
  { id: "ar_khru", name: "Khruangbin", genres: "psychedelic,funk,thai funk", popularity: 70 },
  { id: "ar_glass", name: "Glass Animals", genres: "indie pop,alternative", popularity: 78 },
  { id: "ar_float", name: "Floating Points", genres: "electronic,ambient", popularity: 60 },
  { id: "ar_sufjan", name: "Sufjan Stevens", genres: "indie folk,chamber pop", popularity: 66 },
];

const TRACKS: SeedTrack[] = [
  { id: "tr_letit", name: "Let It Happen", artistId: "ar_tame", album: "Currents", durationMs: 467000, popularity: 79, weight: 9, f: [0.66, 0.74, 0.55, 0.07, 0.21, 0.05, 121] },
  { id: "tr_borderline", name: "Borderline", artistId: "ar_tame", album: "The Slow Rush", durationMs: 237000, popularity: 76, weight: 7, f: [0.74, 0.69, 0.72, 0.10, 0.10, 0.04, 99] },
  { id: "tr_around", name: "Around the World", artistId: "ar_daft", album: "Homework", durationMs: 429000, popularity: 75, weight: 8, f: [0.82, 0.78, 0.66, 0.02, 0.55, 0.06, 121] },
  { id: "tr_onemore", name: "One More Time", artistId: "ar_daft", album: "Discovery", durationMs: 320000, popularity: 81, weight: 10, f: [0.79, 0.83, 0.80, 0.01, 0.18, 0.07, 123] },
  { id: "tr_weird", name: "Weird Fishes", artistId: "ar_radio", album: "In Rainbows", durationMs: 318000, popularity: 73, weight: 8, f: [0.45, 0.62, 0.34, 0.21, 0.30, 0.04, 158] },
  { id: "tr_nimrod", name: "Nude", artistId: "ar_radio", album: "In Rainbows", durationMs: 255000, popularity: 70, weight: 5, f: [0.30, 0.34, 0.20, 0.62, 0.12, 0.03, 62] },
  { id: "tr_holocene", name: "Holocene", artistId: "ar_bon", album: "Bon Iver", durationMs: 337000, popularity: 72, weight: 6, f: [0.32, 0.30, 0.28, 0.71, 0.04, 0.03, 73] },
  { id: "tr_skinny", name: "Skinny Love", artistId: "ar_bon", album: "For Emma", durationMs: 238000, popularity: 74, weight: 5, f: [0.36, 0.28, 0.31, 0.83, 0.01, 0.04, 153] },
  { id: "tr_sun", name: "Sun Models", artistId: "ar_odesza", album: "Summer's Gone", durationMs: 244000, popularity: 64, weight: 6, f: [0.61, 0.72, 0.58, 0.06, 0.40, 0.05, 110] },
  { id: "tr_late", name: "Late Night", artistId: "ar_odesza", album: "A Moment Apart", durationMs: 222000, popularity: 62, weight: 5, f: [0.58, 0.66, 0.49, 0.09, 0.45, 0.05, 100] },
  { id: "tr_feather", name: "Feather", artistId: "ar_nujabes", album: "Modal Soul", durationMs: 207000, popularity: 67, weight: 9, f: [0.64, 0.50, 0.62, 0.34, 0.62, 0.06, 90] },
  { id: "tr_luvsic", name: "Luv(sic)", artistId: "ar_nujabes", album: "Hydeout", durationMs: 268000, popularity: 65, weight: 7, f: [0.62, 0.48, 0.55, 0.38, 0.55, 0.18, 88] },
  { id: "tr_maria", name: "Maria Tambien", artistId: "ar_khru", album: "Con Todo El Mundo", durationMs: 242000, popularity: 63, weight: 6, f: [0.71, 0.61, 0.68, 0.18, 0.74, 0.05, 116] },
  { id: "tr_white", name: "White Gloves", artistId: "ar_khru", album: "The Universe Smiles", durationMs: 273000, popularity: 60, weight: 4, f: [0.66, 0.45, 0.59, 0.41, 0.81, 0.04, 102] },
  { id: "tr_heat", name: "Heat Waves", artistId: "ar_glass", album: "Dreamland", durationMs: 239000, popularity: 85, weight: 11, f: [0.76, 0.53, 0.53, 0.44, 0.00, 0.09, 81] },
  { id: "tr_gooey", name: "Gooey", artistId: "ar_glass", album: "Zaba", durationMs: 273000, popularity: 68, weight: 6, f: [0.70, 0.55, 0.46, 0.24, 0.02, 0.06, 75] },
  { id: "tr_kuiper", name: "Kuiper", artistId: "ar_float", album: "Elaenia", durationMs: 363000, popularity: 52, weight: 4, f: [0.40, 0.58, 0.32, 0.20, 0.88, 0.04, 120] },
  { id: "tr_silhouette", name: "Silhouettes", artistId: "ar_float", album: "Crush", durationMs: 312000, popularity: 55, weight: 4, f: [0.48, 0.64, 0.30, 0.12, 0.79, 0.05, 118] },
  { id: "tr_chicago", name: "Chicago", artistId: "ar_sufjan", album: "Illinois", durationMs: 366000, popularity: 69, weight: 5, f: [0.43, 0.55, 0.62, 0.55, 0.18, 0.04, 132] },
  { id: "tr_fourth", name: "Fourth of July", artistId: "ar_sufjan", album: "Carrie & Lowell", durationMs: 285000, popularity: 64, weight: 4, f: [0.28, 0.24, 0.18, 0.86, 0.22, 0.03, 96] },
];

// Listening peaks: a little in the morning, a dip midday, a big late-night run.
const HOUR_WEIGHTS = [
  3, 1, 1, 1, 1, 2, 4, 7, 9, 8, 6, 5, 6, 6, 5, 5, 6, 7, 9, 12, 14, 15, 16, 11,
];
// Slightly heavier on weekends.
const DAY_WEIGHTS = [7, 5, 5, 5, 6, 9, 9]; // Sun..Sat

function weightedPick(rng: () => number, weights: number[]): number {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rng() * total;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i];
    if (r <= 0) return i;
  }
  return weights.length - 1;
}

export function seedDemo(db: DatabaseSync, plays = 720, days = 120): void {
  const rng = mulberry32(20250621);
  resetTables(db);

  const insArtist = db.prepare(
    "INSERT INTO artists (id, name, genres, popularity, image_url) VALUES (?, ?, ?, ?, ?)",
  );
  for (const a of ARTISTS) {
    insArtist.run(a.id, a.name, a.genres, a.popularity, null);
  }

  const insTrack = db.prepare(
    "INSERT INTO tracks (id, name, artist_ids, album_id, album_name, duration_ms, popularity, preview_url, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
  );
  const insFeat = db.prepare(
    "INSERT INTO audio_features (track_id, danceability, energy, key, loudness, mode, speechiness, acousticness, instrumentalness, liveness, valence, tempo, time_signature) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
  );
  for (const t of TRACKS) {
    insTrack.run(t.id, t.name, t.artistId, `al_${t.id}`, t.album, t.durationMs, t.popularity, null, null);
    const [dance, energy, val, acou, instr, speech, tempo] = t.f;
    insFeat.run(
      t.id, dance, energy, Math.floor(rng() * 12), -8 + rng() * 6, rng() > 0.5 ? 1 : 0,
      speech, acou, instr, 0.08 + rng() * 0.2, val, tempo, 4,
    );
  }

  const trackPool: SeedTrack[] = [];
  for (const t of TRACKS) for (let i = 0; i < t.weight; i++) trackPool.push(t);

  const insPlay = db.prepare(
    "INSERT INTO play_history (track_id, played_at, context_type, context_uri) VALUES (?, ?, ?, ?)",
  );
  const now = Date.now();
  const rows: { trackId: string; at: number }[] = [];
  for (let i = 0; i < plays; i++) {
    const dayBack = Math.floor(rng() * days);
    const base = new Date(now - dayBack * 86400000);
    const hour = weightedPick(rng, HOUR_WEIGHTS);
    // Nudge the weekday so the heatmap reflects the day weights too.
    let d = base;
    for (let tries = 0; tries < 4; tries++) {
      if (DAY_WEIGHTS[d.getDay()] / 9 >= rng()) break;
      d = new Date(d.getTime() - 86400000);
    }
    d.setHours(hour, Math.floor(rng() * 60), Math.floor(rng() * 60), 0);
    const track = trackPool[Math.floor(rng() * trackPool.length)];
    rows.push({ trackId: track.id, at: d.getTime() });
  }
  rows.sort((a, b) => a.at - b.at);
  for (const r of rows) {
    insPlay.run(r.trackId, new Date(r.at).toISOString(), "playlist", "spotify:playlist:demo");
  }

  db.prepare(
    "INSERT INTO sync_log (synced_at, tracks_added, cursor) VALUES (?, ?, ?)",
  ).run(new Date().toISOString(), rows.length, null);
}

// Allow running this file directly: `npm run seed`
const invokedDirectly =
  process.argv[1] && process.argv[1].replace(/\\/g, "/").endsWith("db/seed.ts");
if (invokedDirectly) {
  const db = getDb();
  seedDemo(db);
  console.log("Seeded demo listening history.");
}
