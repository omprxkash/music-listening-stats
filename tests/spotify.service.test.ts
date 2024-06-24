import { describe, expect, it } from "vitest";
import {
  base64Url,
  buildAuthUrl,
  generateCodeChallenge,
  generateCodeVerifier,
  generateState,
  SPOTIFY_SCOPES,
} from "../src/server/services/spotify.service.ts";

describe("base64Url", () => {
  it("produces url-safe output with no padding", () => {
    const out = base64Url(Buffer.from([251, 255, 191]));
    expect(out).not.toMatch(/[+/=]/);
  });
});

describe("PKCE code challenge", () => {
  // The worked example straight out of RFC 7636, Appendix B.
  it("matches the RFC 7636 test vector", () => {
    const verifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";
    expect(generateCodeChallenge(verifier)).toBe(
      "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM",
    );
  });

  it("generates verifiers that are url-safe and long enough", () => {
    const verifier = generateCodeVerifier();
    expect(verifier.length).toBeGreaterThanOrEqual(43);
    expect(verifier).not.toMatch(/[+/=]/);
  });

  it("generates unique state values", () => {
    expect(generateState()).not.toBe(generateState());
  });
});

describe("buildAuthUrl", () => {
  const url = buildAuthUrl({
    clientId: "abc123",
    redirectUri: "http://localhost:3000/auth/callback",
    codeChallenge: "challenge-value",
    state: "state-value",
  });
  const parsed = new URL(url);

  it("points at Spotify's authorize endpoint", () => {
    expect(parsed.origin + parsed.pathname).toBe("https://accounts.spotify.com/authorize");
  });

  it("carries the PKCE and client params", () => {
    expect(parsed.searchParams.get("client_id")).toBe("abc123");
    expect(parsed.searchParams.get("code_challenge_method")).toBe("S256");
    expect(parsed.searchParams.get("code_challenge")).toBe("challenge-value");
    expect(parsed.searchParams.get("response_type")).toBe("code");
    expect(parsed.searchParams.get("state")).toBe("state-value");
  });

  it("requests the scopes we need", () => {
    expect(parsed.searchParams.get("scope")).toBe(SPOTIFY_SCOPES.join(" "));
  });
});
