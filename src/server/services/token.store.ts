import { getDb } from "../db/database.ts";
import { refreshAccessToken, type TokenResponse } from "./spotify.service.ts";

// Where the Spotify tokens actually live (one row in auth_tokens). Kept apart
// from spotify.service.ts so that file never has to touch the database.

export function saveTokens(tokens: TokenResponse, existingRefresh?: string): void {
  const db = getDb();
  const expiresAt = Date.now() + tokens.expires_in * 1000;
  db.prepare(
    `INSERT INTO auth_tokens (id, access_token, refresh_token, expires_at)
     VALUES (1, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       access_token = excluded.access_token,
       refresh_token = COALESCE(excluded.refresh_token, auth_tokens.refresh_token),
       expires_at = excluded.expires_at`,
  ).run(tokens.access_token, tokens.refresh_token ?? existingRefresh ?? null, expiresAt);
}

export function getStoredTokens(): {
  access_token: string;
  refresh_token: string;
  expires_at: number;
} | null {
  const db = getDb();
  const row = db
    .prepare("SELECT access_token, refresh_token, expires_at FROM auth_tokens WHERE id = 1")
    .get() as { access_token: string; refresh_token: string; expires_at: number } | undefined;
  return row ?? null;
}

export function clearTokens(): void {
  getDb().exec("DELETE FROM auth_tokens;");
}

/** Hand back a valid access token, refreshing it first if it's about to expire. */
export async function getValidAccessToken(): Promise<string | null> {
  const stored = getStoredTokens();
  if (!stored) return null;
  // Refresh a minute early so a slow request never trips over the expiry.
  if (Date.now() > stored.expires_at - 60_000 && stored.refresh_token) {
    const refreshed = await refreshAccessToken(stored.refresh_token);
    saveTokens(refreshed, stored.refresh_token);
    return refreshed.access_token;
  }
  return stored.access_token;
}
