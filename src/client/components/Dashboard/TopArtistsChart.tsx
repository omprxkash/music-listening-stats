import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useTopArtists } from "../../hooks/useStats";

const BARS = ["#1db954", "#3ddc84", "#5ec8c0", "#6aa6ff", "#9a7bff", "#c86bd6"];

export function TopArtistsChart({ limit }: { limit: number }) {
  const { data, isLoading } = useTopArtists(limit);

  return (
    <div className="panel">
      <div className="panel-title">Top artists</div>
      {isLoading || !data ? (
        <Empty />
      ) : (
        <ResponsiveContainer width="100%" height={Math.max(220, data.length * 34)}>
          <BarChart data={data} layout="vertical" margin={{ left: 8, right: 24 }}>
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="name"
              width={120}
              tick={{ fill: "#c7cdda", fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              cursor={{ fill: "rgba(255,255,255,0.04)" }}
              contentStyle={tooltipStyle}
              formatter={(v: number) => [`${v} plays`, "Plays"]}
            />
            <Bar dataKey="playCount" radius={[0, 6, 6, 0]}>
              {data.map((_, i) => (
                <Cell key={i} fill={BARS[i % BARS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export const tooltipStyle = {
  background: "#0d0f14",
  border: "1px solid #242837",
  borderRadius: 12,
  color: "#e8ebf2",
  fontSize: 12,
};

function Empty() {
  return <div className="h-48 grid place-items-center text-muted">No plays yet.</div>;
}
