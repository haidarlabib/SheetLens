import { NextRequest, NextResponse } from "next/server";
import { getSession, updateConnectedSheet } from "@/lib/auth/session";
import {
  createGoogleSpreadsheet,
  getValidAccessToken,
} from "@/lib/sheets/googleSheets";

export async function POST(request: NextRequest) {
  // 1. Authenticate user session
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json(
      { error: "Unauthorized. Please sign in to Google." },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { spreadsheetName, sheetName = "Sheet1", columns } = body;

    // 2. Validate input parameters
    if (!spreadsheetName || typeof spreadsheetName !== "string" || !spreadsheetName.trim()) {
      return NextResponse.json(
        { error: "Please provide a valid spreadsheet name." },
        { status: 400 }
      );
    }

    if (!Array.isArray(columns) || columns.length === 0) {
      return NextResponse.json(
        { error: "Please define at least one column for your spreadsheet." },
        { status: 400 }
      );
    }

    if (columns.length > 50) {
      return NextResponse.json(
        { error: "Maximum 50 columns allowed per spreadsheet." },
        { status: 400 }
      );
    }

    // 3. Validate column names for emptiness and duplicates
    const cleanedColumns: string[] = [];
    const seenNames = new Set<string>();

    for (let i = 0; i < columns.length; i++) {
      const col = typeof columns[i] === "string" ? columns[i].trim() : "";
      if (!col) {
        return NextResponse.json(
          { error: `Column #${i + 1} cannot be empty. Please enter a column name.` },
          { status: 400 }
        );
      }

      const lower = col.toLowerCase();
      if (seenNames.has(lower)) {
        return NextResponse.json(
          { error: `Duplicate column name "${col}" detected. Column names must be unique.` },
          { status: 400 }
        );
      }

      seenNames.add(lower);
      cleanedColumns.push(col);
    }

    // 4. Obtain valid OAuth access token and create spreadsheet on Google Sheets
    const accessToken = await getValidAccessToken(session);
    const connectedSheet = await createGoogleSpreadsheet(
      {
        spreadsheetName: spreadsheetName.trim(),
        sheetName: (sheetName || "Sheet1").trim(),
        columns: cleanedColumns,
      },
      accessToken
    );

    // 5. Save connected spreadsheet to encrypted user session
    await updateConnectedSheet(connectedSheet);

    return NextResponse.json({
      success: true,
      data: connectedSheet,
    });
  } catch (err: unknown) {
    console.error("Error creating Google Spreadsheet:", err);
    const message =
      err instanceof Error ? err.message : "Failed to create Google Spreadsheet.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
