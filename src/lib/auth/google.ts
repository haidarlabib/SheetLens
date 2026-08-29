import crypto from "crypto";
import { NextRequest } from "next/server";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";

// Explicitly approved least-privilege OAuth scopes:
// 1. openid, userinfo.email, userinfo.profile: Identity & display info
// 2. drive.file: Per-file access (e.g. Google Picker / created files), avoiding broad drive.readonly
// 3. spreadsheets: Read & write access to Google Sheets
const REQUIRED_SCOPES = [
  "openid",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/spreadsheets",
];

/**
 * Resolves the application base URL with dynamic request host inspection,
 * environment configuration, and Vercel support.
 */
export function getBaseUrl(request?: Request | NextRequest): string {
  // If request is provided, inspect HTTP headers for exact current origin
  if (request) {
    const forwardedHost = request.headers.get("x-forwarded-host");
    const host = forwardedHost || request.headers.get("host");
    if (host) {
      const forwardedProto = request.headers.get("x-forwarded-proto");
      const isLocalhost = host.includes("localhost") || host.includes("127.0.0.1");
      const proto = forwardedProto || (isLocalhost ? "http" : "https");
      return `${proto}://${host}`.replace(/\/$/, "");
    }
    try {
      const parsed = new URL(request.url);
      return parsed.origin.replace(/\/$/, "");
    } catch {}
  }

  // Check explicit environment configuration
  if (process.env.NEXT_PUBLIC_APP_URL) {
    let url = process.env.NEXT_PUBLIC_APP_URL.trim().replace(/\/$/, "");
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = `https://${url}`;
    }
    return url;
  }

  // Check Vercel default domain
  if (process.env.VERCEL_URL) {
    let url = process.env.VERCEL_URL.trim().replace(/\/$/, "");
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = `https://${url}`;
    }
    return url;
  }

  return "http://localhost:3000";
}

/**
 * Computes the exact OAuth redirect URI matching the active host
 */
export function getRedirectUri(request?: Request | NextRequest): string {
  return `${getBaseUrl(request)}/api/auth/google/callback`;
}

// Generate secure random state and PKCE verifier/challenge
export function generatePKCE() {
  const state = crypto.randomBytes(32).toString("hex");
  const codeVerifier = crypto.randomBytes(32).toString("base64url");
  const codeChallenge = crypto
    .createHash("sha256")
    .update(codeVerifier)
    .digest("base64url");

  return { state, codeVerifier, codeChallenge };
}

/**
 * Builds the Google OAuth consent URL with full PKCE, offline access, and exact redirect URI
 */
export function buildGoogleAuthUrl(
  state: string,
  codeChallenge: string,
  redirectUri?: string
): string {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new Error("GOOGLE_CLIENT_ID environment variable is missing.");
  }

  const effectiveRedirectUri = redirectUri || getRedirectUri();

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: effectiveRedirectUri,
    response_type: "code",
    scope: REQUIRED_SCOPES.join(" "),
    access_type: "offline",
    prompt: "consent",
    state: state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });

  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

export interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
  token_type: string;
  id_token?: string;
}

export interface GoogleUserInfo {
  sub: string;
  email: string;
  name: string;
  picture?: string;
}

/**
 * Exchanges authorization code and PKCE verifier for Google tokens
 */
export async function exchangeCodeForTokens(
  code: string,
  codeVerifier: string,
  redirectUri?: string
): Promise<GoogleTokenResponse> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Google OAuth credentials missing in environment.");
  }

  const effectiveRedirectUri = redirectUri || getRedirectUri();

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: effectiveRedirectUri,
      grant_type: "authorization_code",
      code_verifier: codeVerifier,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google token exchange failed: ${errorText}`);
  }

  return response.json();
}

/**
 * Fetches authenticated user info using access token
 */
export async function fetchGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo> {
  const response = await fetch(GOOGLE_USERINFO_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch Google user profile: ${errorText}`);
  }

  return response.json();
}

/**
 * Refreshes an expired access token using the refresh token
 */
export async function refreshGoogleAccessToken(refreshToken: string): Promise<{
  accessToken: string;
  expiresIn: number;
}> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Google OAuth credentials missing.");
  }

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to refresh Google access token.");
  }

  const data = await response.json();
  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in,
  };
}
