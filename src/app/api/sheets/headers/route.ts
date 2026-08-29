import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import {
  fetchSheetHeaderRow,
  getValidAccessToken,
  extractSpreadsheetId,
} from "@/lib/sheets/googleSheets";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rawId = request.nextUrl.searchParams.get("spreadsheetId");
  const sheetTitle = request.nextUrl.searchParams.get("sheetTitle");

  if (!rawId || !sheetTitle) {
    return NextResponse.json(
      { error: "Missing spreadsheetId or sheetTitle parameter" },
      { status: 400 }
    );
  }

  const spreadsheetId = extractSpreadsheetId(rawId);
  if (!spreadsheetId) {
    return NextResponse.json(
      { error: "Invalid Google Spreadsheet ID format" },
      { status: 400 }
    );
  }

  try {
    const accessToken = await getValidAccessToken(session);
    const headersResult = await fetchSheetHeaderRow(
      spreadsheetId,
      sheetTitle,
      accessToken
    );
    return NextResponse.json({ success: true, data: headersResult });
  } catch (err: unknown) {
    console.error("Error reading sheet header row:", err);
    const message = err instanceof Error ? err.message : "Failed to read header row";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
