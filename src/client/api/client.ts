// One small typed wrapper around fetch so the hooks stay tidy. Everything is
// served from the same origin in dev (Vite proxies /api across to Express).

async function get<T>(path: string): Promise<T> {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Request to ${path} failed (${res.status})`);
  return (await res.json()) as T;
}

export interface TopArtist {
  id: string;
  name: string;
  genres: string[];
  playCount: number;
}
export interface TopTrack {
  id: string;
  name: string;
  artist: string;
  album: string | null;
  playCount: number;
}
export interface HeatmapCell {
  hour: number;
  day: number;
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
export interface Summary {
  totalMinutes: number;
  totalPlays: number;
  uniqueArtists: number;
  topGenre: string;
  avgEnergy: number;
}
export interface Health {
  ok: boolean;
  demoMode: boolean;
  plays: number;
  connected: boolean;
}

export interface FavoriteAlbum {
  rank?: number;
  title: string;
  artist: string;
  year?: number;
  why?: string;
  appleMusic?: string;
  spotify?: string;
  cover?: string;
}
export interface FavoriteSong {
  title: string;
  artist: string;
  album?: string;
  appleMusic?: string;
  spotify?: string;
}
export interface PlaylistLink {
  name: string;
  platform?: string;
  url?: string;
  note?: string;
  tracklist?: string;
}
export interface PlaylistTrack {
  title: string;
  artist: string;
  album: string;
}
export interface PlaylistTracklist {
  name: string;
  platform: string;
  url: string;
  total: number;
  tracks: PlaylistTrack[];
}
export interface ProfileLink {
  platform: string;
  handle?: string;
  url?: string;
}

export const api = {
  health: () => get<Health>("/api/health"),
  summary: () => get<Summary>("/api/stats/summary"),
  topArtists: (limit: number) => get<TopArtist[]>(`/api/stats/top-artists?limit=${limit}`),
  topTracks: (limit: number) => get<TopTrack[]>(`/api/stats/top-tracks?limit=${limit}`),
  heatmap: () => get<HeatmapCell[]>("/api/stats/listening-heatmap"),
  genres: () => get<GenreSlice[]>("/api/stats/genre-distribution"),
  audioFeatures: () => get<AveragedFeatures>("/api/stats/audio-features-avg"),
  personality: () => get<Personality>("/api/stats/personality"),
  favoriteAlbums: () =>
    get<{ note?: string; albums: FavoriteAlbum[] }>("/api/favorites/albums"),
  favoriteSongs: () => get<{ note?: string; songs: FavoriteSong[] }>("/api/favorites/songs"),
  playlists: () =>
    get<{ note?: string; profile?: string; playlists: PlaylistLink[] }>(
      "/api/favorites/playlists",
    ),
  profiles: () => get<{ note?: string; profiles: ProfileLink[] }>("/api/favorites/profiles"),
  playlistTracks: (slug: string) => get<PlaylistTracklist>(`/api/favorites/tracklist/${slug}`),
};
