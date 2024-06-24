export function SpotifyConnectButton({ connected }: { connected: boolean }) {
  if (connected) {
    return <span className="pill border-spot/40 text-spot">Spotify connected</span>;
  }
  return (
    <a
      href="/auth/spotify"
      className="inline-flex items-center gap-2 rounded-full bg-spot px-4 py-2 text-sm font-semibold text-ink hover:brightness-110 transition"
    >
      Connect Spotify
    </a>
  );
}
