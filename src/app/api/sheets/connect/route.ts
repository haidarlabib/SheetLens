import { NextRequest, NextResponse } from "next/server";
import { getSession, updateConnectedSheet, ConnectedSpreadsheet } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      spreadsheetId,
      spreadsheetTitle,
      sheetId,
      sheetTitle,
      headers,
      headerCount,
    } = body;

    if (!spreadsheetId || !sheetTitle || !Array.isArray(headers)) {
      return NextResponse.json(
        { error: "Invalid payload parameters" },
        { status: 400 }
      );
    }

    const connectedSheet: ConnectedSpreadsheet = {
      spreadsheetId,
      spreadsheetTitle: spreadsheetTitle || "Untitled Spreadsheet",
      spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
      sheetId: Number(sheetId) || 0,
      sheetTitle,
      headers,
      headerCount: Number(headerCount) || headers.filter((h) => h.valid).length,
      connectedAt: Date.now(),
    };

    const success = await updateConnectedSheet(connectedSheet);
    if (!success) {
      return NextResponse.json({ error: "Failed to persist connection to session" }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: connectedSheet });
  } catch (err: unknown) {
    console.error("Error saving connected spreadsheet:", err);
    return NextResponse.json({ error: "Failed to save spreadsheet connection" }, { status: 500 });
  }
}
