import { usePersonality } from "../hooks/useStats";

export function MusicPersonalityCard() {
  const { data, isLoading } = usePersonality();

  return (
    <div className="panel h-full bg-gradient-to-br from-panel to-ink relative overflow-hidden">
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-spot/10 blur-2xl" />
      <div className="panel-title">Your music personality</div>
      {isLoading || !data ? (
        <div className="text-muted">Working it out…</div>
      ) : (
        <div className="relative">
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="pill border-spot/40 text-spot">{data.trait}</span>
            <span className="pill">{data.timeTrait}</span>
          </div>
          <h3 className="text-2xl font-semibold mb-3">{data.label}</h3>
          <p className="text-slate-300 leading-relaxed max-w-prose">{data.description}</p>
          <p className="text-xs text-muted mt-4">
            Worked out from plain thresholds over your average audio features — same input,
            same answer, every time.
          </p>
        </div>
      )}
    </div>
  );
}
