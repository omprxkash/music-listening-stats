import { useTopTracks } from "../../hooks/useStats";

export function TopTracksTable({ limit }: { limit: number }) {
  const { data, isLoading } = useTopTracks(limit);

  return (
    <div className="panel">
      <div className="panel-title">Most played tracks</div>
      {isLoading || !data ? (
        <div className="h-32 grid place-items-center text-muted">Loading…</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted text-xs uppercase tracking-wide">
                <th className="py-2 w-8">#</th>
                <th className="py-2">Track</th>
                <th className="py-2">Artist</th>
                <th className="py-2 hidden sm:table-cell">Album</th>
                <th className="py-2 text-right">Plays</th>
              </tr>
            </thead>
            <tbody>
              {data.map((t, i) => (
                <tr key={t.id} className="border-t border-edge/60">
                  <td className="py-2 text-muted tabular-nums">{i + 1}</td>
                  <td className="py-2 font-medium">{t.name}</td>
                  <td className="py-2 text-slate-300">{t.artist}</td>
                  <td className="py-2 text-muted hidden sm:table-cell">{t.album ?? "—"}</td>
                  <td className="py-2 text-right tabular-nums text-spot">{t.playCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
