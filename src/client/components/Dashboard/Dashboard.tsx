import { useState } from "react";
import { SummaryCards } from "../SummaryCards";
import { MusicPersonalityCard } from "../MusicPersonalityCard";
import { TopArtistsChart } from "./TopArtistsChart";
import { TopTracksTable } from "./TopTracksTable";
import { GenrePieChart } from "./GenrePieChart";
import { ListeningHeatmap } from "./ListeningHeatmap";
import { AudioFeaturesRadar } from "./AudioFeaturesRadar";

export function Dashboard() {
  const [limit, setLimit] = useState(10);

  return (
    <div className="space-y-6">
      <SummaryCards />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <MusicPersonalityCard />
        </div>
        <AudioFeaturesRadar />
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-200">Top of the pile</h2>
        <div className="flex gap-1">
          {[5, 10, 20].map((n) => (
            <button
              key={n}
              onClick={() => setLimit(n)}
              className={`px-3 py-1 rounded-full text-xs border transition ${
                limit === n
                  ? "border-spot text-spot bg-spot/10"
                  : "border-edge text-muted hover:text-slate-200"
              }`}
            >
              Top {n}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <TopArtistsChart limit={limit} />
        <GenrePieChart />
      </div>

      <ListeningHeatmap />
      <TopTracksTable limit={limit} />
    </div>
  );
}
