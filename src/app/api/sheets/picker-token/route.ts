import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getValidAccessToken } from "@/lib/sheets/googleSheets";

export async function GET() {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const accessToken = await getValidAccessToken(session);
    
    // Extract App ID / Project Number from Google Client ID if not explicitly specified
    const clientId = process.env.GOOGLE_CLIENT_ID || "";
    const appId =
      process.env.GOOGLE_CLOUD_PROJECT_NUMBER ||
      process.env.GOOGLE_APP_ID ||
      process.env.NEXT_PUBLIC_GOOGLE_APP_ID ||
      clientId.split("-")[0] ||
      "";
    const apiKey =
      process.env.GOOGLE_PICKER_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      process.env.NEXT_PUBLIC_GOOGLE_PICKER_API_KEY ||
      process.env.NEXT_PUBLIC_GOOGLE_API_KEY ||
      "";

    return NextResponse.json({
      accessToken,
      appId,
      apiKey,
    });
  } catch (error) {
    console.error("Failed to generate picker token payload:", error);
    return NextResponse.json({ error: "Failed to initialize picker token" }, { status: 500 });
  }
}
