import { Router } from "express";
import { syncRecentlyPlayed } from "../services/sync.service.ts";

export const syncRouter = Router();

syncRouter.post("/", async (_req, res) => {
  try {
    const result = await syncRecentlyPlayed();
    res.status(result.ok ? 200 : 400).json(result);
  } catch (err) {
    res.status(500).json({ ok: false, tracksAdded: 0, message: (err as Error).message });
  }
});
