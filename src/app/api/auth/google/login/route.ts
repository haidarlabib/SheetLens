import { NextResponse } from "next/server";
import { generatePKCE, buildGoogleAuthUrl } from "@/lib/auth/google";
import { setOAuthStateCookie } from "@/lib/auth/session";

export async function GET() {
  try {
    const { state, codeVerifier, codeChallenge } = generatePKCE();
    await setOAuthStateCookie(state, codeVerifier);

    const authUrl = buildGoogleAuthUrl(state, codeChallenge);
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error("Login redirect failed:", error);
    return NextResponse.json(
      { error: "Failed to initiate Google authentication." },
      { status: 500 }
    );
  }
}
