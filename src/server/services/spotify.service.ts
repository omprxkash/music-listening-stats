import { createHash, randomBytes } from "node:crypto";

// Everything that talks to Spotify lives here. The interesting (and testable)
// bits are the PKCE helpers and the URL building — the rest is just polite
// wrappers around fetch. Token persistence lives next door in token.store.ts so
// this file stays free of any database (and stays trivially unit-testable).

const SPOTIFY_ACCOUNTS = "https://accounts.spotify.com";
const SPOTIFY_API = "https://api.spotify.com/v1";

export const SPOTIFY_SCOPES = [
  "user-top-read",
  "user-read-recently-played",
  "user-read-private",
];

/** base64url with no padding, the way OAuth PKCE wants it. */
export function base64Url(input: Buffer): string {
  return input
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function generateCodeVerifier(bytes = 64): string {
  return base64Url(randomBytes(bytes));
}

export function generateCodeChallenge(verifier: string): string {
  return base64Url(createHash("sha256").update(verifier).digest());
}

export function generateState(): string {
  return base64Url(randomBytes(16));
}

export interface AuthUrlParams {
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
  state: string;
  scopes?: string[];
}

export function buildAuthUrl(params: AuthUrlParams): string {
  const query = new URLSearchParams({
    client_id: params.clientId,
    response_type: "code",
    redirect_uri: params.redirectUri,
    code_challenge_method: "S256",
    code_challenge: params.codeChallenge,
    state: params.state,
    scope: (params.scopes ?? SPOTIFY_SCOPES).join(" "),
  });
  return `${SPOTIFY_ACCOUNTS}/authorize?${query.toString()}`;
}

export interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
}

export async function exchangeCodeForTokens(
  code: string,
  codeVerifier: string,
): Promise<TokenResponse> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: process.env.SPOTIFY_REDIRECT_URI ?? "",
    client_id: process.env.SPOTIFY_CLIENT_ID ?? "",
    code_verifier: codeVerifier,
  });
  const res = await fetch(`${SPOTIFY_ACCOUNTS}/api/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) throw new Error(`Token exchange failed: ${res.status}`);
  return (await res.json()) as TokenResponse;
}

export async function refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: process.env.SPOTIFY_CLIENT_ID ?? "",
  });
  const res = await fetch(`${SPOTIFY_ACCOUNTS}/api/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) throw new Error(`Token refresh failed: ${res.status}`);
  return (await res.json()) as TokenResponse;
}

async function apiGet<T>(path: string, accessToken: string): Promise<T> {
  const res = await fetch(`${SPOTIFY_API}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`Spotify GET ${path} failed: ${res.status}`);
  return (await res.json()) as T;
}

export function getTopArtists(token: string, range = "medium_term", limit = 50) {
  return apiGet<{ items: unknown[] }>(`/me/top/artists?time_range=${range}&limit=${limit}`, token);
}
export function getTopTracks(token: string, range = "medium_term", limit = 50) {
  return apiGet<{ items: unknown[] }>(`/me/top/tracks?time_range=${range}&limit=${limit}`, token);
}
export function getRecentlyPlayed(token: string, before?: number) {
  const q = before ? `&before=${before}` : "";
  return apiGet<{ items: unknown[]; cursors?: { before?: string } }>(
    `/me/player/recently-played?limit=50${q}`,
    token,
  );
}
export function getAudioFeatures(token: string, ids: string[]) {
  return apiGet<{ audio_features: unknown[] }>(
    `/audio-features?ids=${ids.slice(0, 100).join(",")}`,
    token,
  );
}
export function getArtistsByIds(token: string, ids: string[]) {
  return apiGet<{ artists: unknown[] }>(`/artists?ids=${ids.slice(0, 50).join(",")}`, token);
}
