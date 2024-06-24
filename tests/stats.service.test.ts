import { describe, expect, it } from "vitest";
import {
  aggregateGenres,
  averageAudioFeatures,
  computePersonality,
  dominantTrait,
  listeningHeatmap,
  peakListeningHour,
  summarize,
  timeTrait,
  type AudioFeatureRow,
  type PlayRow,
} from "../src/server/services/stats.service.ts";

// A couple of plays I can reason about by hand. 2023-06-19 was a Monday.
const plays: PlayRow[] = [
  { played_at: "2023-06-19T09:30:00", duration_ms: 200000 }, // Mon 09
  { played_at: "2023-06-19T09:45:00", duration_ms: 200000 }, // Mon 09
  { played_at: "2023-06-19T23:10:00", duration_ms: 200000 }, // Mon 23
  { played_at: "2023-06-20T14:00:00", duration_ms: 200000 }, // Tue 14
];

describe("listeningHeatmap", () => {
  it("always returns a full 24x7 grid", () => {
    expect(listeningHeatmap([])).toHaveLength(168);
  });

  it("counts plays into the right hour/day cells", () => {
    const cells = listeningHeatmap(plays);
    const mon9 = cells.find((c) => c.day === 1 && c.hour === 9);
    const mon23 = cells.find((c) => c.day === 1 && c.hour === 23);
    expect(mon9?.count).toBe(2);
    expect(mon23?.count).toBe(1);
  });

  it("ignores unparseable timestamps", () => {
    const cells = listeningHeatmap([{ played_at: "not-a-date" }]);
    expect(cells.reduce((s, c) => s + c.count, 0)).toBe(0);
  });
});

describe("peakListeningHour", () => {
  it("finds the busiest hour", () => {
    expect(peakListeningHour(plays)).toBe(9);
  });
});

describe("aggregateGenres", () => {
  it("counts per play and adds up to ~100%", () => {
    const slices = aggregateGenres([["rock"], ["rock", "indie"], ["indie"]]);
    const rock = slices.find((s) => s.genre === "rock");
    expect(rock?.count).toBe(2);
    const total = slices.reduce((s, g) => s + g.percentage, 0);
    expect(total).toBeGreaterThan(99);
    expect(total).toBeLessThan(101);
  });

  it("rolls the long tail into an 'Other' bucket", () => {
    const lists = Array.from({ length: 12 }, (_, i) => [`g${i}`]);
    const slices = aggregateGenres(lists, 5);
    expect(slices.at(-1)?.genre).toBe("Other");
    expect(slices.length).toBe(6);
  });

  it("returns nothing when there are no genres", () => {
    expect(aggregateGenres([[], []])).toEqual([]);
  });
});

describe("averageAudioFeatures", () => {
  it("averages each feature", () => {
    const rows: AudioFeatureRow[] = [
      feat({ energy: 0.2, danceability: 0.4 }),
      feat({ energy: 0.8, danceability: 0.6 }),
    ];
    const avg = averageAudioFeatures(rows);
    expect(avg.energy).toBeCloseTo(0.5, 5);
    expect(avg.danceability).toBeCloseTo(0.5, 5);
  });

  it("returns zeros for an empty list", () => {
    expect(averageAudioFeatures([]).energy).toBe(0);
  });
});

describe("dominantTrait", () => {
  it("respects the priority order (energy wins over danceability)", () => {
    const avg = averageAudioFeatures([feat({ energy: 0.9, danceability: 0.9 })]);
    expect(dominantTrait(avg)).toBe("High-Energy Listener");
  });

  it("falls back to eclectic when nothing crosses a threshold", () => {
    const avg = averageAudioFeatures([feat({})]);
    expect(dominantTrait(avg)).toBe("Eclectic Listener");
  });

  it("picks acoustic when that's the standout", () => {
    const avg = averageAudioFeatures([feat({ acousticness: 0.8 })]);
    expect(dominantTrait(avg)).toBe("Acoustic Soul");
  });
});

describe("timeTrait", () => {
  it("maps hours to the right label", () => {
    expect(timeTrait(23)).toBe("Night Owl");
    expect(timeTrait(2)).toBe("Night Owl");
    expect(timeTrait(8)).toBe("Morning Listener");
    expect(timeTrait(13)).toBe("Lunch-Break Groover");
    expect(timeTrait(17)).toBe("All-Day Listener");
  });
});

describe("computePersonality", () => {
  it("combines trait and time into one label", () => {
    const avg = averageAudioFeatures([feat({ energy: 0.9 })]);
    const p = computePersonality(avg, 23);
    expect(p.label).toBe("High-Energy Listener · Night Owl");
    expect(p.description).toContain("%");
  });
});

describe("summarize", () => {
  it("totals minutes and surfaces the top genre", () => {
    const genres = aggregateGenres([["rock"], ["rock"], ["indie"]]);
    const avg = averageAudioFeatures([feat({ energy: 0.5 })]);
    const s = summarize(plays, 3, genres, avg);
    expect(s.totalPlays).toBe(4);
    expect(s.totalMinutes).toBe(Math.round((4 * 200000) / 60000));
    expect(s.uniqueArtists).toBe(3);
    expect(s.topGenre).toBe("rock");
  });
});

function feat(over: Partial<AudioFeatureRow>): AudioFeatureRow {
  return {
    danceability: 0, energy: 0, valence: 0, acousticness: 0,
    instrumentalness: 0, speechiness: 0, liveness: 0, tempo: 120,
    ...over,
  };
}
