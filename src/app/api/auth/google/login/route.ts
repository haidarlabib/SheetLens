import { NextRequest, NextResponse } from "next/server";
import { generatePKCE, buildGoogleAuthUrl, getRedirectUri } from "@/lib/auth/google";
import { OAUTH_STATE_COOKIE_NAME } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { state, codeVerifier, codeChallenge } = generatePKCE();
    const redirectUri = getRedirectUri(request);
    const authUrl = buildGoogleAuthUrl(state, codeChallenge, redirectUri);

    const response = NextResponse.redirect(authUrl, { status: 302 });

    // Explicitly attach the transient PKCE/State cookie directly to redirect response headers
    const cookieValue = JSON.stringify({ state, codeVerifier });
    const isProduction =
      process.env.NODE_ENV === "production" ||
      !request.nextUrl.hostname.includes("localhost");

    response.cookies.set(OAUTH_STATE_COOKIE_NAME, cookieValue, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      maxAge: 10 * 60, // 10 minutes
    });

    return response;
  } catch (error) {
    console.error("Login redirect failed:", error);
    return NextResponse.json(
      { error: "Failed to initiate Google authentication." },
      { status: 500 }
    );
  }
}
