import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import {
  fetchSpreadsheetMetadata,
  getValidAccessToken,
  extractSpreadsheetId,
} from "@/lib/sheets/googleSheets";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rawId = request.nextUrl.searchParams.get("spreadsheetId");
  if (!rawId) {
    return NextResponse.json(
      { error: "Missing spreadsheetId parameter" },
      { status: 400 }
    );
  }

  const spreadsheetId = extractSpreadsheetId(rawId);
  if (!spreadsheetId) {
    return NextResponse.json(
      { error: "Invalid Google Spreadsheet ID or URL format" },
      { status: 400 }
    );
  }

  try {
    const accessToken = await getValidAccessToken(session);
    const details = await fetchSpreadsheetMetadata(spreadsheetId, accessToken);
    return NextResponse.json({ success: true, data: details });
  } catch (err: unknown) {
    console.error("Error fetching spreadsheet metadata:", err);
    const message = err instanceof Error ? err.message : "Failed to load spreadsheet details";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
