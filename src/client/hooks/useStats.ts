import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";

// Thin react-query hooks. Stats rarely change mid-session, so a generous
// stale time keeps things snappy without hammering the API.
const STALE = 60_000;

export const useHealth = () =>
  useQuery({ queryKey: ["health"], queryFn: api.health });

export const useSummary = () =>
  useQuery({ queryKey: ["summary"], queryFn: api.summary, staleTime: STALE });

export const useTopArtists = (limit: number) =>
  useQuery({ queryKey: ["top-artists", limit], queryFn: () => api.topArtists(limit), staleTime: STALE });

export const useTopTracks = (limit: number) =>
  useQuery({ queryKey: ["top-tracks", limit], queryFn: () => api.topTracks(limit), staleTime: STALE });

export const useHeatmap = () =>
  useQuery({ queryKey: ["heatmap"], queryFn: api.heatmap, staleTime: STALE });

export const useGenres = () =>
  useQuery({ queryKey: ["genres"], queryFn: api.genres, staleTime: STALE });

export const useAudioFeatures = () =>
  useQuery({ queryKey: ["audio-features"], queryFn: api.audioFeatures, staleTime: STALE });

export const usePersonality = () =>
  useQuery({ queryKey: ["personality"], queryFn: api.personality, staleTime: STALE });
