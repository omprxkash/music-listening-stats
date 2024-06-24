// The number-crunching, kept deliberately pure: every function here takes plain
// rows and returns plain results, no database and no side effects. That makes it
// easy to reason about and easy to test, and it keeps all the "how do I feel
// about this listener" logic in one honest place.

export interface PlayRow {
  played_at: string;
  duration_ms?: number | null;
}

export interface AudioFeatureRow {
  danceability: number;
  energy: number;
  valence: number;
  acousticness: number;
  instrumentalness: number;
  speechiness: number;
  liveness: number;
  tempo: number;
}

export interface HeatmapCell {
  hour: number; // 0..23
  day: number; // 0=Sun .. 6=Sat
  count: number;
}

export interface GenreSlice {
  genre: string;
  count: number;
  percentage: number;
}

export interface AveragedFeatures {
  danceability: number;
  energy: number;
  valence: number;
  acousticness: number;
  instrumentalness: number;
  speechiness: number;
  liveness: number;
  tempo: number;
}

export interface Personality {
  label: string;
  trait: string;
  timeTrait: string;
  description: string;
}

/** A full 24x7 grid so the heatmap always has every cell, even the quiet ones. */
export function listeningHeatmap(plays: PlayRow[]): HeatmapCell[] {
  const grid = new Map<string, number>();
  for (const p of plays) {
    const d = new Date(p.played_at);
    if (Number.isNaN(d.getTime())) continue;
    const key = `${d.getHours()}-${d.getDay()}`;
    grid.set(key, (grid.get(key) ?? 0) + 1);
  }
  const cells: HeatmapCell[] = [];
  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      cells.push({ hour, day, count: grid.get(`${hour}-${day}`) ?? 0 });
    }
  }
  return cells;
}

/** The hour of day with the most plays — used to flavour the personality card. */
export function peakListeningHour(plays: PlayRow[]): number {
  const byHour = new Array(24).fill(0);
  for (const p of plays) {
    const d = new Date(p.played_at);
    if (!Number.isNaN(d.getTime())) byHour[d.getHours()]++;
  }
  let peak = 0;
  for (let h = 1; h < 24; h++) if (byHour[h] > byHour[peak]) peak = h;
  return peak;
}

/**
 * Roll a list of genre lists (one per play) up into shares of the pie.
 * Genres are counted per play, so heavier-rotation artists weigh more.
 */
export function aggregateGenres(genreLists: string[][], top = 8): GenreSlice[] {
  const counts = new Map<string, number>();
  let total = 0;
  for (const list of genreLists) {
    for (const raw of list) {
      const genre = raw.trim();
      if (!genre) continue;
      counts.set(genre, (counts.get(genre) ?? 0) + 1);
      total++;
    }
  }
  if (total === 0) return [];
  const sorted = [...counts.entries()]
    .map(([genre, count]) => ({ genre, count, percentage: round1((count / total) * 100) }))
    .sort((a, b) => b.count - a.count);

  const head = sorted.slice(0, top);
  const tail = sorted.slice(top);
  if (tail.length) {
    const count = tail.reduce((s, g) => s + g.count, 0);
    head.push({ genre: "Other", count, percentage: round1((count / total) * 100) });
  }
  return head;
}

export function averageAudioFeatures(features: AudioFeatureRow[]): AveragedFeatures {
  const blank: AveragedFeatures = {
    danceability: 0, energy: 0, valence: 0, acousticness: 0,
    instrumentalness: 0, speechiness: 0, liveness: 0, tempo: 0,
  };
  if (features.length === 0) return blank;
  for (const f of features) {
    blank.danceability += f.danceability;
    blank.energy += f.energy;
    blank.valence += f.valence;
    blank.acousticness += f.acousticness;
    blank.instrumentalness += f.instrumentalness;
    blank.speechiness += f.speechiness;
    blank.liveness += f.liveness;
    blank.tempo += f.tempo;
  }
  const n = features.length;
  return {
    danceability: round3(blank.danceability / n),
    energy: round3(blank.energy / n),
    valence: round3(blank.valence / n),
    acousticness: round3(blank.acousticness / n),
    instrumentalness: round3(blank.instrumentalness / n),
    speechiness: round3(blank.speechiness / n),
    liveness: round3(blank.liveness / n),
    tempo: round1(blank.tempo / n),
  };
}

const TRAIT_RULES: { test: (f: AveragedFeatures) => boolean; label: string }[] = [
  { test: (f) => f.energy > 0.7, label: "High-Energy Listener" },
  { test: (f) => f.valence > 0.6, label: "Positive-Vibes Seeker" },
  { test: (f) => f.acousticness > 0.6, label: "Acoustic Soul" },
  { test: (f) => f.instrumentalness > 0.4, label: "Instrumental Explorer" },
  { test: (f) => f.danceability > 0.7, label: "Groove Seeker" },
  { test: (f) => f.speechiness > 0.33, label: "Word Lover" },
];

export function dominantTrait(f: AveragedFeatures): string {
  for (const rule of TRAIT_RULES) if (rule.test(f)) return rule.label;
  return "Eclectic Listener";
}

export function timeTrait(peakHour: number): string {
  if (peakHour >= 22 || peakHour < 5) return "Night Owl";
  if (peakHour >= 6 && peakHour <= 9) return "Morning Listener";
  if (peakHour >= 12 && peakHour <= 14) return "Lunch-Break Groover";
  return "All-Day Listener";
}

export function computePersonality(f: AveragedFeatures, peakHour: number): Personality {
  const trait = dominantTrait(f);
  const tt = timeTrait(peakHour);
  const description =
    `You lean ${describeTrait(trait)} — your average track sits around ` +
    `${pct(f.energy)} energy, ${pct(f.danceability)} danceability and ` +
    `${pct(f.valence)} mood. Most of your listening lands when you're a ` +
    `${tt.toLowerCase()}, peaking around ${formatHour(peakHour)}.`;
  return { label: `${trait} · ${tt}`, trait, timeTrait: tt, description };
}

export interface Summary {
  totalMinutes: number;
  totalPlays: number;
  uniqueArtists: number;
  topGenre: string;
  avgEnergy: number;
}

export function summarize(
  plays: PlayRow[],
  uniqueArtists: number,
  genres: GenreSlice[],
  avg: AveragedFeatures,
): Summary {
  const totalMs = plays.reduce((s, p) => s + (p.duration_ms ?? 0), 0);
  return {
    totalMinutes: Math.round(totalMs / 60000),
    totalPlays: plays.length,
    uniqueArtists,
    topGenre: genres[0]?.genre ?? "—",
    avgEnergy: avg.energy,
  };
}

// --- little helpers ---------------------------------------------------------

function describeTrait(trait: string): string {
  switch (trait) {
    case "High-Energy Listener": return "loud and wide awake";
    case "Positive-Vibes Seeker": return "bright and warm";
    case "Acoustic Soul": return "stripped-back and acoustic";
    case "Instrumental Explorer": return "wordless and atmospheric";
    case "Groove Seeker": return "rhythmic and danceable";
    case "Word Lover": return "lyric-forward";
    default: return "all over the map (in the best way)";
  }
}

function formatHour(h: number): string {
  const period = h < 12 ? "am" : "pm";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}${period}`;
}

function pct(v: number): string {
  return `${Math.round(v * 100)}%`;
}
function round1(v: number): number {
  return Math.round(v * 10) / 10;
}
function round3(v: number): number {
  return Math.round(v * 1000) / 1000;
}
