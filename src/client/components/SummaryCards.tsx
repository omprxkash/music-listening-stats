import { useSummary } from "../hooks/useStats";

export function SummaryCards() {
  const { data, isLoading } = useSummary();

  const cards = [
    { label: "Minutes listened", value: data ? data.totalMinutes.toLocaleString() : "—" },
    { label: "Total plays", value: data ? data.totalPlays.toLocaleString() : "—" },
    { label: "Artists in rotation", value: data ? String(data.uniqueArtists) : "—" },
    { label: "Top genre", value: data ? data.topGenre : "—" },
  ];

  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => (
        <div key={c.label} className="panel">
          <div className="text-2xl font-semibold tabular-nums">
            {isLoading ? "…" : c.value}
          </div>
          <div className="text-xs text-muted mt-1">{c.label}</div>
        </div>
      ))}
    </div>
  );
}
