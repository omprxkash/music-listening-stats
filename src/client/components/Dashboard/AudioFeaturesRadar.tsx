import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";
import { useAudioFeatures } from "../../hooks/useStats";

export function AudioFeaturesRadar() {
  const { data, isLoading } = useAudioFeatures();

  const chart = data
    ? [
        { axis: "Energy", value: data.energy },
        { axis: "Dance", value: data.danceability },
        { axis: "Mood", value: data.valence },
        { axis: "Acoustic", value: data.acousticness },
        { axis: "Instrumental", value: data.instrumentalness },
        { axis: "Speech", value: data.speechiness },
      ]
    : [];

  return (
    <div className="panel h-full">
      <div className="panel-title">The shape of my sound</div>
      {isLoading || !data ? (
        <div className="h-56 grid place-items-center text-muted">Loading…</div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <RadarChart data={chart} outerRadius="72%">
            <PolarGrid stroke="#242837" />
            <PolarAngleAxis dataKey="axis" tick={{ fill: "#c7cdda", fontSize: 11 }} />
            <Radar
              dataKey="value"
              stroke="#1db954"
              fill="#1db954"
              fillOpacity={0.35}
              isAnimationActive={false}
            />
          </RadarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
