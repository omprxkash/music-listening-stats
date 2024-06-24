import { Router } from "express";
import {
  buildAuthUrl,
  exchangeCodeForTokens,
  generateCodeChallenge,
  generateCodeVerifier,
  generateState,
} from "../services/spotify.service.ts";
import { clearTokens, getStoredTokens, saveTokens } from "../services/token.store.ts";

export const authRouter = Router();

// One person, one machine, one login at a time — a tiny in-memory map keyed by
// the OAuth `state` is plenty to remember the PKCE verifier between the two legs
// of the redirect.
const pending = new Map<string, string>();

const CLIENT_URL = process.env.CLIENT_URL ?? "http://localhost:5173";

authRouter.get("/spotify", (_req, res) => {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI;
  if (!clientId || !redirectUri) {
    return res.status(400).json({
      error:
        "No Spotify credentials set. Copy .env.example to .env, or just run the site in demo mode.",
    });
  }
  const verifier = generateCodeVerifier();
  const challenge = generateCodeChallenge(verifier);
  const state = generateState();
  pending.set(state, verifier);
  res.redirect(buildAuthUrl({ clientId, redirectUri, codeChallenge: challenge, state }));
});

authRouter.get("/callback", async (req, res) => {
  const { code, state } = req.query as { code?: string; state?: string };
  if (!code || !state || !pending.has(state)) {
    return res.status(400).send("That login link looks stale — give it another go.");
  }
  const verifier = pending.get(state)!;
  pending.delete(state);
  try {
    const tokens = await exchangeCodeForTokens(code, verifier);
    saveTokens(tokens);
    res.redirect(`${CLIENT_URL}/?connected=1`);
  } catch (err) {
    res.status(500).send(`Could not finish the Spotify handshake: ${(err as Error).message}`);
  }
});

authRouter.get("/status", (_req, res) => {
  const tokens = getStoredTokens();
  res.json({ connected: Boolean(tokens?.access_token) });
});

authRouter.post("/logout", (_req, res) => {
  clearTokens();
  res.json({ ok: true });
});
