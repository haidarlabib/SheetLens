import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import {
  fetchSheetDataAndAnalysis,
  getValidAccessToken,
  extractSpreadsheetId,
} from "@/lib/sheets/googleSheets";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const querySpreadsheetId = request.nextUrl.searchParams.get("spreadsheetId");
  const querySheetTitle = request.nextUrl.searchParams.get("sheetTitle");
  const queryLimit = parseInt(request.nextUrl.searchParams.get("limit") || "250", 10);

  const spreadsheetId =
    extractSpreadsheetId(querySpreadsheetId || "") ||
    session.connectedSheet?.spreadsheetId;

  const sheetTitle = querySheetTitle || session.connectedSheet?.sheetTitle;

  if (!spreadsheetId || !sheetTitle) {
    return NextResponse.json(
      { error: "No active Google Spreadsheet connected." },
      { status: 400 }
    );
  }

  try {
    const accessToken = await getValidAccessToken(session);
    const dataPayload = await fetchSheetDataAndAnalysis(
      spreadsheetId,
      sheetTitle,
      accessToken,
      Math.min(queryLimit, 500)
    );

    return NextResponse.json({
      success: true,
      data: {
        ...dataPayload,
        spreadsheetTitle: session.connectedSheet?.spreadsheetTitle,
      },
    });
  } catch (err: unknown) {
    console.error("Error fetching spreadsheet data and analysis:", err);
    const message =
      err instanceof Error ? err.message : "Failed to load spreadsheet data.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
