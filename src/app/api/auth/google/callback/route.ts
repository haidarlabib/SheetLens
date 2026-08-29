import { NextRequest, NextResponse } from "next/server";
import {
  exchangeCodeForTokens,
  fetchGoogleUserInfo,
  getBaseUrl,
} from "@/lib/auth/google";
import {
  getAndClearOAuthStateCookie,
  createSession,
  SessionPayload,
} from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const baseUrl = getBaseUrl();

  if (error) {
    console.error("Google OAuth error callback:", error);
    return NextResponse.redirect(`${baseUrl}/?error=${encodeURIComponent(error)}`);
  }

  if (!code || !state) {
    return NextResponse.redirect(`${baseUrl}/?error=missing_oauth_parameters`);
  }

  try {
    const savedStateData = await getAndClearOAuthStateCookie();
    if (!savedStateData || savedStateData.state !== state) {
      console.error("Invalid state or state mismatch in OAuth callback");
      return NextResponse.redirect(`${baseUrl}/?error=state_mismatch`);
    }

    // Exchange authorization code for tokens
    const tokens = await exchangeCodeForTokens(code, savedStateData.codeVerifier);

    // Fetch user profile from Google
    const profile = await fetchGoogleUserInfo(tokens.access_token);

    // Build session payload
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

    // Encrypt & store session in HTTP-Only cookie
    await createSession(sessionPayload);

    // Redirect to authenticated home
    return NextResponse.redirect(`${baseUrl}/home`);
  } catch (err: unknown) {
    console.error("OAuth callback processing error:", err);
    const msg = err instanceof Error ? err.message : "auth_callback_failed";
    return NextResponse.redirect(`${baseUrl}/?error=${encodeURIComponent(msg)}`);
  }
}
