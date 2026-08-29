import { cookies } from "next/headers";
import { EncryptJWT, jwtDecrypt } from "jose";
import { ConnectedSpreadsheet } from "@/lib/sheets/types";
export { type ConnectedSpreadsheet } from "@/lib/sheets/types";

const SESSION_COOKIE_NAME = "sheetlens_session";
const OAUTH_STATE_COOKIE_NAME = "sheetlens_oauth_state";

// 30 days session duration
const SESSION_MAX_AGE = 30 * 24 * 60 * 60;

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

export interface SessionTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number; // timestamp in ms
  scope?: string;
}

export interface SessionPayload {
  user: SessionUser;
  tokens: SessionTokens;
  connectedSheet?: ConnectedSpreadsheet | null;
}

// Derive a consistent 256-bit encryption key
function getEncryptionKey(): Uint8Array {
  const secret =
    process.env.SESSION_SECRET ||
    process.env.GOOGLE_CLIENT_SECRET ||
    "sheetlens_default_secure_secret_fallback_key_2026_x9k2";
  
  // Pad/slice to 32 bytes for AES-256-GCM
  const encoder = new TextEncoder();
  const rawKey = encoder.encode(secret);
  const key = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    key[i] = rawKey[i % rawKey.length];
  }
  return key;
}

/**
 * Encrypt and store session payload in HTTP-Only, Secure cookie
 */
export async function createSession(payload: SessionPayload): Promise<void> {
  const key = getEncryptionKey();
  const jwt = await new EncryptJWT({ ...payload })
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .encrypt(key);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, jwt, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

/**
 * Retrieve and decrypt the current session from HTTP-Only cookie
 */
export async function getSession(): Promise<SessionPayload | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!sessionCookie) return null;

    const key = getEncryptionKey();
    const { payload } = await jwtDecrypt(sessionCookie, key);
    return payload as unknown as SessionPayload;
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "digest" in error &&
      (error as { digest: string }).digest === "DYNAMIC_SERVER_USAGE"
    ) {
      throw error;
    }
    console.error("Failed to decrypt session:", error);
    return null;
  }
}

/**
 * Update the connected spreadsheet on the active session
 */
export async function updateConnectedSheet(
  connectedSheet: ConnectedSpreadsheet | null
): Promise<boolean> {
  const session = await getSession();
  if (!session) return false;

  session.connectedSheet = connectedSheet;
  await createSession(session);
  return true;
}

/**
 * Clear session cookie on sign out
 */
export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Store PKCE state and verifier in short-lived transient cookie
 */
export async function setOAuthStateCookie(state: string, codeVerifier: string): Promise<void> {
  const cookieStore = await cookies();
  const value = JSON.stringify({ state, codeVerifier });
  cookieStore.set(OAUTH_STATE_COOKIE_NAME, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 10 * 60, // 10 minutes
  });
}

/**
 * Retrieve and clear transient PKCE state cookie
 */
export async function getAndClearOAuthStateCookie(): Promise<{ state: string; codeVerifier: string } | null> {
  try {
    const cookieStore = await cookies();
    const cookie = cookieStore.get(OAUTH_STATE_COOKIE_NAME)?.value;
    if (!cookie) return null;
    cookieStore.delete(OAUTH_STATE_COOKIE_NAME);
    return JSON.parse(cookie);
  } catch {
    return null;
  }
}
