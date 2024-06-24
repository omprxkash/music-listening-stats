import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";

export const useFavoriteAlbums = () =>
  useQuery({ queryKey: ["fav-albums"], queryFn: api.favoriteAlbums });

export const useFavoriteSongs = () =>
  useQuery({ queryKey: ["fav-songs"], queryFn: api.favoriteSongs });

export const usePlaylists = () =>
  useQuery({ queryKey: ["playlists"], queryFn: api.playlists });

export const useProfiles = () =>
  useQuery({ queryKey: ["profiles"], queryFn: api.profiles });

export const usePlaylistTracks = (slug: string, enabled: boolean) =>
  useQuery({
    queryKey: ["tracklist", slug],
    queryFn: () => api.playlistTracks(slug),
    enabled: enabled && !!slug,
    staleTime: Infinity,
  });
