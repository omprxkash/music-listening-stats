import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { useGenres } from "../../hooks/useStats";
import { tooltipStyle } from "./TopArtistsChart";

const COLORS = [
  "#1db954", "#3ddc84", "#5ec8c0", "#6aa6ff", "#9a7bff",
  "#c86bd6", "#e8709b", "#f0a35e", "#cdd35e", "#6b7280",
];

export function GenrePieChart() {
  const { data, isLoading } = useGenres();

  return (
    <div className="panel">
      <div className="panel-title">Genre mix</div>
      {isLoading || !data || data.length === 0 ? (
        <div className="h-48 grid place-items-center text-muted">No genres yet.</div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={data}
              dataKey="count"
              nameKey="genre"
              innerRadius={55}
              outerRadius={90}
              paddingAngle={2}
              stroke="none"
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v: number, _n, p) => [`${(p.payload as { percentage: number }).percentage}%`, (p.payload as { genre: string }).genre]}
            />
            <Legend
              wrapperStyle={{ fontSize: 12, color: "#8b93a7" }}
              iconType="circle"
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
