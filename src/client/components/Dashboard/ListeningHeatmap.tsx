import { useHeatmap } from "../../hooks/useStats";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function ListeningHeatmap() {
  const { data, isLoading } = useHeatmap();

  const max = data ? Math.max(1, ...data.map((c) => c.count)) : 1;
  const lookup = new Map<string, number>();
  data?.forEach((c) => lookup.set(`${c.day}-${c.hour}`, c.count));

  return (
    <div className="panel">
      <div className="panel-title">When I listen</div>
      {isLoading || !data ? (
        <div className="h-40 grid place-items-center text-muted">Loading…</div>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[640px]">
            <div className="flex">
              <div className="w-10" />
              {Array.from({ length: 24 }).map((_, h) => (
                <div key={h} className="flex-1 text-center text-[10px] text-muted">
                  {h % 3 === 0 ? h : ""}
                </div>
              ))}
            </div>
            {DAYS.map((day, d) => (
              <div key={day} className="flex items-center">
                <div className="w-10 text-[11px] text-muted">{day}</div>
                {Array.from({ length: 24 }).map((_, h) => {
                  const count = lookup.get(`${d}-${h}`) ?? 0;
                  const intensity = count / max;
                  return (
                    <div key={h} className="flex-1 px-[2px]">
                      <div
                        title={`${day} ${h}:00 — ${count} plays`}
                        className="h-5 rounded-[3px]"
                        style={{
                          backgroundColor:
                            count === 0
                              ? "rgba(255,255,255,0.04)"
                              : `rgba(29,185,84,${0.18 + intensity * 0.82})`,
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
      <p className="text-xs text-muted mt-3">
        Darker green means more plays in that hour. Mine lights up in the evenings.
      </p>
    </div>
  );
}
