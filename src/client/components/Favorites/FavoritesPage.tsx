import { useState } from "react";
import {
  useFavoriteAlbums,
  useFavoriteSongs,
  usePlaylists,
  useProfiles,
  usePlaylistTracks,
} from "../../hooks/useFavorites";
import type {
  FavoriteAlbum,
  FavoriteSong,
  PlaylistLink,
  ProfileLink,
} from "../../api/client";

export function FavoritesPage() {
  const albums = useFavoriteAlbums();
  const songs = useFavoriteSongs();
  const playlists = usePlaylists();
  const profiles = useProfiles();

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-xl font-semibold mb-1">Albums I'd hand to anyone</h2>
        <p className="text-sm text-muted mb-4">
          The records I keep coming back to. Edit{" "}
          <code className="text-slate-300">data/favorite-albums.json</code> to make this list
          your own.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(albums.data?.albums ?? []).map((a, i) => (
            <AlbumCard key={`${a.title}-${i}`} album={a} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Songs on repeat</h2>
        <div className="panel divide-y divide-edge/60">
          {(songs.data?.songs ?? []).map((s, i) => (
            <SongRow key={`${s.title}-${i}`} song={s} index={i} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-1">My playlists</h2>
        <p className="text-sm text-muted mb-4">
          Apple Music and Spotify share links live in{" "}
          <code className="text-slate-300">data/apple-music.json</code>.
        </p>
        {playlists.data?.profile ? (
          <a
            href={playlists.data.profile}
            target="_blank"
            rel="noreferrer"
            className="pill mb-4 hover:text-slate-100"
          >
            My profile ↗
          </a>
        ) : null}
        <div className="grid gap-4 sm:grid-cols-2">
          {(playlists.data?.playlists ?? []).map((p, i) => (
            <PlaylistCard key={`${p.name}-${i}`} playlist={p} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-1">Find me across the music web</h2>
        <p className="text-sm text-muted mb-4">
          The same taste, rated and listed elsewhere — Apple Music, Spotify, and the
          rating communities I hang around in. Links live in{" "}
          <code className="text-slate-300">data/profiles.json</code>.
        </p>
        <div className="flex flex-wrap gap-3">
          {(profiles.data?.profiles ?? []).map((p, i) => (
            <ProfileChip key={`${p.platform}-${i}`} profile={p} />
          ))}
        </div>
      </section>
    </div>
  );
}

function ProfileChip({ profile }: { profile: ProfileLink }) {
  const inner = (
    <>
      <span className="font-medium text-slate-200">{profile.platform}</span>
      {profile.handle ? <span className="text-muted ml-2">{profile.handle}</span> : null}
    </>
  );
  if (!profile.url) {
    return (
      <span className="panel !p-3 opacity-50 text-sm" title="No link yet">
        {inner}
      </span>
    );
  }
  return (
    <a
      href={profile.url}
      target="_blank"
      rel="noreferrer"
      className="panel !p-3 text-sm hover:border-spot/50 transition-colors"
    >
      {inner} <span className="text-spot">↗</span>
    </a>
  );
}

function AlbumCard({ album }: { album: FavoriteAlbum }) {
  return (
    <div className="panel flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-semibold leading-tight">{album.title}</div>
          <div className="text-sm text-muted">
            {album.artist}
            {album.year ? ` · ${album.year}` : ""}
          </div>
        </div>
        {album.rank ? <span className="pill">#{album.rank}</span> : null}
      </div>
      {album.why ? <p className="text-sm text-slate-300">{album.why}</p> : null}
      <div className="flex gap-2 mt-auto pt-2">
        <LinkChip href={album.appleMusic} label="Apple Music" />
        <LinkChip href={album.spotify} label="Spotify" />
      </div>
    </div>
  );
}

function SongRow({ song, index }: { song: FavoriteSong; index: number }) {
  return (
    <div className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
      <span className="text-muted text-sm tabular-nums w-5">{index + 1}</span>
      <div className="flex-1">
        <div className="font-medium">{song.title}</div>
        <div className="text-sm text-muted">
          {song.artist}
          {song.album ? ` · ${song.album}` : ""}
        </div>
      </div>
      <div className="flex gap-2">
        <LinkChip href={song.appleMusic} label="Apple" />
        <LinkChip href={song.spotify} label="Spotify" />
      </div>
    </div>
  );
}

function PlaylistCard({ playlist }: { playlist: PlaylistLink }) {
  const [expanded, setExpanded] = useState(false);
  const tracks = usePlaylistTracks(playlist.tracklist ?? "", expanded);

  return (
    <div className="panel">
      <div className="flex items-center justify-between">
        <div className="font-semibold">{playlist.name}</div>
        {playlist.platform ? <span className="pill">{playlist.platform}</span> : null}
      </div>
      {playlist.note ? <p className="text-sm text-muted mt-2">{playlist.note}</p> : null}
      <div className="flex items-center gap-3 mt-3">
        <LinkChip href={playlist.url} label="Open playlist ↗" />
        {playlist.tracklist ? (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-xs text-muted hover:text-slate-200 transition-colors"
          >
            {expanded ? "Hide tracks ↑" : `Show tracks ↓`}
          </button>
        ) : null}
      </div>

      {expanded && (
        <div className="mt-4 border-t border-edge/40 pt-3">
          {tracks.isLoading && (
            <p className="text-xs text-muted">Loading tracks…</p>
          )}
          {tracks.data && (
            <>
              <p className="text-xs text-muted mb-2">{tracks.data.total} songs</p>
              <div className="h-72 overflow-y-auto pr-1 space-y-0">
                {tracks.data.tracks.map((t, i) => (
                  <div
                    key={i}
                    className="flex gap-2 py-1.5 border-b border-edge/20 last:border-0 text-sm"
                  >
                    <span className="tabular-nums text-muted w-6 shrink-0 text-xs pt-0.5">
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="truncate leading-snug">{t.title}</div>
                      <div className="text-xs text-muted truncate">{t.artist}</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function LinkChip({ href, label }: { href?: string; label: string }) {
  if (!href) {
    return <span className="pill opacity-40">{label}</span>;
  }
  return (
    <a href={href} target="_blank" rel="noreferrer" className="pill hover:text-slate-100 hover:border-spot/40">
      {label}
    </a>
  );
}
