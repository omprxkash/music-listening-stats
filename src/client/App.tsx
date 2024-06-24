import { useState } from "react";
import { useHealth } from "./hooks/useStats";
import { SpotifyConnectButton } from "./components/SpotifyConnectButton";
import { Dashboard } from "./components/Dashboard/Dashboard";
import { FavoritesPage } from "./components/Favorites/FavoritesPage";

type Tab = "dashboard" | "favorites";

export default function App() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const { data: health } = useHealth();

  return (
    <div className="min-h-screen">
      <header className="border-b border-edge bg-panel/40 backdrop-blur sticky top-0 z-10">
        <div className="mx-auto max-w-6xl px-5 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-spot/20 grid place-items-center text-spot text-lg">
              ♫
            </div>
            <div>
              <h1 className="text-lg font-semibold leading-none">music-listening-stats</h1>
              <p className="text-xs text-muted mt-1">my listening, my favourites, in one place</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {health?.demoMode && <span className="pill">demo data</span>}
            <SpotifyConnectButton connected={health?.connected ?? false} />
          </div>
        </div>
        <nav className="mx-auto max-w-6xl px-5 flex gap-1">
          <TabButton active={tab === "dashboard"} onClick={() => setTab("dashboard")}>
            Dashboard
          </TabButton>
          <TabButton active={tab === "favorites"} onClick={() => setTab("favorites")}>
            My Favourites
          </TabButton>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8">
        {tab === "dashboard" ? <Dashboard /> : <FavoritesPage />}
      </main>

      <footer className="mx-auto max-w-6xl px-5 py-10 text-center text-xs text-muted">
        Built and kept by me. Numbers are computed with plain, boring math — no guessing.
      </footer>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
        active
          ? "border-spot text-slate-100"
          : "border-transparent text-muted hover:text-slate-200"
      }`}
    >
      {children}
    </button>
  );
}
