import "dotenv/config";
import express from "express";
import cors from "cors";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { getDb, rowCount } from "./db/database.ts";
import { seedDemo } from "./db/seed.ts";
import { authRouter } from "./routes/auth.ts";
import { statsRouter } from "./routes/stats.ts";
import { syncRouter } from "./routes/sync.ts";
import { favoritesRouter } from "./routes/favorites.ts";

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(here, "..", "..");
const PORT = Number(process.env.PORT ?? 3000);

const db = getDb();

// `--demo` (or DEMO=1) drops in a believable listening history so the whole
// site works with no Spotify account at all.
const demoMode = process.argv.includes("--demo") || process.env.DEMO === "1";
if (demoMode && rowCount(db, "play_history") === 0) {
  seedDemo(db);
  console.log("Demo mode: seeded a sample listening history.");
}

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    demoMode,
    plays: rowCount(db, "play_history"),
    connected: rowCount(db, "auth_tokens") > 0,
  });
});

app.use("/auth", authRouter);
app.use("/api/stats", statsRouter);
app.use("/api/sync", syncRouter);
app.use("/api/favorites", favoritesRouter);

// In production we serve the built client straight from Express.
const clientDist = resolve(ROOT, "dist");
if (existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get("*", (_req, res) => res.sendFile(resolve(clientDist, "index.html")));
}

app.listen(PORT, () => {
  console.log(`music-listening-stats API listening on http://localhost:${PORT}`);
  if (!demoMode && rowCount(db, "play_history") === 0) {
    console.log("Tip: run `npm run demo` to explore with sample data, or connect Spotify.");
  }
});
