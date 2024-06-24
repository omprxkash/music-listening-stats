import { Router } from "express";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// The favourites are just JSON files in /data that anyone can edit and commit.
// We read them fresh on each request so a quick edit shows up without a restart.

const here = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(here, "..", "..", "..", "data");

export const favoritesRouter = Router();

function readJson(file: string): unknown {
  try {
    return JSON.parse(readFileSync(resolve(DATA_DIR, file), "utf8"));
  } catch {
    return null;
  }
}

favoritesRouter.get("/albums", (_req, res) => res.json(readJson("favorite-albums.json")));
favoritesRouter.get("/songs", (_req, res) => res.json(readJson("favorite-songs.json")));
favoritesRouter.get("/playlists", (_req, res) => res.json(readJson("apple-music.json")));
favoritesRouter.get("/profiles", (_req, res) => res.json(readJson("profiles.json")));
favoritesRouter.get("/tracklist/:slug", (req, res) => {
  const slug = req.params.slug.replace(/[^a-z0-9-]/gi, "");
  const data = readJson(`playlist-${slug}.json`);
  if (!data) return res.status(404).json({ error: "not found" });
  return res.json(data);
});
