import { NextRequest, NextResponse } from "next/server";
import {
  exchangeCodeForTokens,
  fetchGoogleUserInfo,
  getBaseUrl,
  getRedirectUri,
} from "@/lib/auth/google";
import {
  encryptSessionPayload,
  SESSION_COOKIE_NAME,
  OAUTH_STATE_COOKIE_NAME,
  SessionPayload,
} from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const baseUrl = getBaseUrl(request);
  const redirectUri = getRedirectUri(request);

  // Extract query parameters with robust fallback
  const parsedUrl = new URL(request.url);
  const code = parsedUrl.searchParams.get("code") || request.nextUrl.searchParams.get("code");
  const state = parsedUrl.searchParams.get("state") || request.nextUrl.searchParams.get("state");
  const error = parsedUrl.searchParams.get("error") || request.nextUrl.searchParams.get("error");
  const errorDescription =
    parsedUrl.searchParams.get("error_description") ||
    request.nextUrl.searchParams.get("error_description");

  // 1. Google returned an OAuth error
  if (error) {
    console.error("Google OAuth callback returned error:", error, errorDescription);
    const errorParam = errorDescription ? `${error}: ${errorDescription}` : error;
    return NextResponse.redirect(`${baseUrl}/?error=${encodeURIComponent(errorParam)}`);
  }

  // 2. Missing authorization code or state parameter
  if (!code && !state) {
    console.error("OAuth callback received neither code nor state.");
    return NextResponse.redirect(`${baseUrl}/?error=missing_oauth_parameters`);
  }
  if (!code) {
    console.error("OAuth callback received state but no authorization code.");
    return NextResponse.redirect(`${baseUrl}/?error=missing_code`);
  }
  if (!state) {
    console.error("OAuth callback received code but no state parameter.");
    return NextResponse.redirect(`${baseUrl}/?error=missing_state`);
  }

  // 3. Retrieve and validate PKCE state cookie
  const stateCookieRaw = request.cookies.get(OAUTH_STATE_COOKIE_NAME)?.value;
  if (!stateCookieRaw) {
    console.error("OAuth state cookie was missing or expired across redirect.");
    return NextResponse.redirect(`${baseUrl}/?error=missing_oauth_cookie`);
  }

  let savedStateData: { state: string; codeVerifier: string };
  try {
    savedStateData = JSON.parse(stateCookieRaw);
  } catch {
    console.error("Failed to parse OAuth state cookie content.");
    return NextResponse.redirect(`${baseUrl}/?error=invalid_state_cookie`);
  }

  if (savedStateData.state !== state) {
    console.error("State mismatch in OAuth callback:", {
      expected: savedStateData.state,
      received: state,
    });
    return NextResponse.redirect(`${baseUrl}/?error=state_mismatch`);
  }

  try {
    // 4. Exchange authorization code and PKCE verifier for Google tokens
    const tokens = await exchangeCodeForTokens(
      code,
      savedStateData.codeVerifier,
      redirectUri
    );

    // 5. Fetch user profile from Google
    const profile = await fetchGoogleUserInfo(tokens.access_token);

    // 6. Build session payload
    const sessionPayload: SessionPayload = {
      user: {
        id: profile.sub,
        email: profile.email,
        name: profile.name,
        picture: profile.picture,
      },
      tokens: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: Date.now() + tokens.expires_in * 1000,
        scope: tokens.scope,
      },
    };

    // 7. Encrypt session JWT
    const { jwt, maxAge } = await encryptSessionPayload(sessionPayload);

    // 8. Construct redirect response with session cookie and delete transient state cookie
    const response = NextResponse.redirect(`${baseUrl}/home`, { status: 302 });
    const isProduction =
      process.env.NODE_ENV === "production" ||
      !request.nextUrl.hostname.includes("localhost");

    response.cookies.set(SESSION_COOKIE_NAME, jwt, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      maxAge: maxAge,
    });

    response.cookies.delete(OAUTH_STATE_COOKIE_NAME);

    return response;
  } catch (err: unknown) {
    console.error("OAuth callback processing error:", err);
    const msg = err instanceof Error ? err.message : "auth_callback_failed";
    return NextResponse.redirect(`${baseUrl}/?error=${encodeURIComponent(msg)}`);
  }
}
