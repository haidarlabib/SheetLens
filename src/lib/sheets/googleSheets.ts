import { SessionPayload, createSession } from "@/lib/auth/session";
import { refreshGoogleAccessToken } from "@/lib/auth/google";
import {
  SpreadsheetDetails,
  SheetTabInfo,
  HeaderDiscoveryResult,
  SheetColumnHeader,
  ConnectedSpreadsheet,
  SheetDataPayload,
  ColumnAnalysis,
  InferredColumnType,
  indexToColumnLetter,
} from "./types";

export * from "./types";

export interface CreateSpreadsheetParams {
  spreadsheetName: string;
  sheetName: string;
  columns: string[];
}

/**
 * Validates and ensures the OAuth access token is active, refreshing if necessary
 */
export async function getValidAccessToken(session: SessionPayload): Promise<string> {
  const isExpiringSoon = Date.now() >= session.tokens.expiresAt - 120000; // 2 min buffer

  if (isExpiringSoon && session.tokens.refreshToken) {
    try {
      const refreshed = await refreshGoogleAccessToken(session.tokens.refreshToken);
      session.tokens.accessToken = refreshed.accessToken;
      session.tokens.expiresAt = Date.now() + refreshed.expiresIn * 1000;
      await createSession(session);
      return refreshed.accessToken;
    } catch (err) {
      console.error("Token refresh failed in sheets client:", err);
    }
  }

  return session.tokens.accessToken;
}

/**
 * Creates a brand new Google Spreadsheet with user-defined sheet name and writes header row
 */
export async function createGoogleSpreadsheet(
  params: CreateSpreadsheetParams,
  accessToken: string
): Promise<ConnectedSpreadsheet> {
  const { spreadsheetName, sheetName = "Sheet1", columns } = params;

  if (!columns || columns.length === 0) {
    throw new Error("At least one column is required to create a spreadsheet.");
  }

  const cleanTitle = spreadsheetName.trim() || "Untitled Spreadsheet";
  const cleanSheetTitle = sheetName.trim() || "Sheet1";

  // 1. Call Google Sheets API to create spreadsheet with initial sheet
  const createUrl = "https://sheets.googleapis.com/v4/spreadsheets";
  const createRes = await fetch(createUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      properties: {
        title: cleanTitle,
      },
      sheets: [
        {
          properties: {
            title: cleanSheetTitle,
            gridProperties: {
              rowCount: 1000,
              columnCount: Math.max(columns.length + 5, 26),
            },
          },
        },
      ],
    }),
  });

  if (!createRes.ok) {
    if (createRes.status === 401 || createRes.status === 403) {
      throw new Error("Google authentication failed. Please sign in again.");
    }
    const errText = await createRes.text();
    throw new Error(`Failed to create Google Spreadsheet: ${createRes.status} ${errText}`);
  }

  const createdData = await createRes.json();
  const spreadsheetId = createdData.spreadsheetId;
  const spreadsheetTitle = createdData.properties?.title || cleanTitle;
  const sheetId = createdData.sheets?.[0]?.properties?.sheetId ?? 0;
  const actualSheetTitle = createdData.sheets?.[0]?.properties?.title || cleanSheetTitle;

  // 2. Write column headers to Row 1
  const updateRange = `${encodeURIComponent(actualSheetTitle)}!1:1`;
  const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${updateRange}?valueInputOption=USER_ENTERED`;

  const writeRes = await fetch(updateUrl, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      range: `${actualSheetTitle}!1:1`,
      majorDimension: "ROWS",
      values: [columns],
    }),
  });

  if (!writeRes.ok) {
    const errText = await writeRes.text();
    console.error("Failed to write header row to newly created spreadsheet:", errText);
    throw new Error("Spreadsheet was created, but setting up header columns failed. Please retry.");
  }

  // 3. Construct ConnectedSpreadsheet format
  const headers: SheetColumnHeader[] = columns.map((colName, idx) => ({
    index: idx,
    letter: indexToColumnLetter(idx),
    name: colName,
    valid: true,
  }));

  return {
    spreadsheetId,
    spreadsheetTitle,
    spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
    sheetId,
    sheetTitle: actualSheetTitle,
    headers,
    headerCount: headers.length,
    connectedAt: Date.now(),
  };
}

/**
 * Fetches spreadsheet metadata (title and sheet tabs) from Google Sheets API v4
 */
export async function fetchSpreadsheetMetadata(
  spreadsheetId: string,
  accessToken: string
): Promise<SpreadsheetDetails> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
    spreadsheetId
  )}?fields=spreadsheetId,properties.title,sheets.properties`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    if (res.status === 404) {
      throw new Error("Spreadsheet not found. Please verify the spreadsheet ID or link.");
    }
    if (res.status === 403) {
      throw new Error(
        "Access denied. Please ensure your Google account has permission to view this spreadsheet."
      );
    }
    const errText = await res.text();
    throw new Error(`Failed to fetch spreadsheet details: ${res.status} ${errText}`);
  }

  const data = await res.json();
  const sheets: SheetTabInfo[] = (data.sheets || []).map(
    (s: {
      properties: {
        sheetId: number;
        title: string;
        index: number;
        gridProperties?: { rowCount?: number; columnCount?: number };
      };
    }) => ({
      sheetId: s.properties.sheetId,
      title: s.properties.title,
      index: s.properties.index,
      rowCount: s.properties.gridProperties?.rowCount,
      columnCount: s.properties.gridProperties?.columnCount,
    })
  );

  return {
    spreadsheetId: data.spreadsheetId,
    title: data.properties?.title || "Untitled Spreadsheet",
    spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${data.spreadsheetId}`,
    sheets,
  };
}

/**
 * Reads row 1 header values and performs schema validation
 */
export async function fetchSheetHeaderRow(
  spreadsheetId: string,
  sheetTitle: string,
  accessToken: string
): Promise<HeaderDiscoveryResult> {
  const range = `${encodeURIComponent(sheetTitle)}!1:1`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
    spreadsheetId
  )}/values/${range}?valueRenderOption=FORMATTED_VALUE`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to read sheet header row: ${res.status} ${errText}`);
  }

  const data = await res.json();
  const rawValues: (string | number | null | undefined)[] = data.values?.[0] || [];

  const headers: SheetColumnHeader[] = [];
  const nameCounts = new Map<string, number>();
  const validationIssues: string[] = [];
  let hasEmptyHeaders = false;
  let hasDuplicateHeaders = false;

  if (rawValues.length === 0) {
    validationIssues.push("Row 1 is completely empty. Please add column header names to your sheet.");
  }

  rawValues.forEach((val, idx) => {
    const colLetter = indexToColumnLetter(idx);
    const strVal = val != null ? String(val).trim() : "";

    if (!strVal) {
      hasEmptyHeaders = true;
      headers.push({
        index: idx,
        letter: colLetter,
        name: `(Empty Column ${colLetter})`,
        valid: false,
      });
      validationIssues.push(`Column ${colLetter} header is empty.`);
      return;
    }

    const lower = strVal.toLowerCase();
    const count = (nameCounts.get(lower) || 0) + 1;
    nameCounts.set(lower, count);

    if (count > 1) {
      hasDuplicateHeaders = true;
      headers.push({
        index: idx,
        letter: colLetter,
        name: strVal,
        valid: false,
      });
      validationIssues.push(`Duplicate column name "${strVal}" detected at Column ${colLetter}.`);
    } else {
      headers.push({
        index: idx,
        letter: colLetter,
        name: strVal,
        valid: true,
      });
    }
  });

  return {
    spreadsheetId,
    sheetTitle,
    headers,
    headerCount: headers.filter((h) => h.valid).length,
    hasEmptyHeaders,
    hasDuplicateHeaders,
    validationIssues,
  };
}

/**
 * Parses raw cell value into clean numeric, date, or string type
 */
function parseCellValue(raw: string): string | number | null {
  if (!raw || raw.trim() === "") return null;
  const trimmed = raw.trim();

  // Currency or thousands format (e.g. "Rp 15.000" or "10,500.00" or "3.000")
  const isNumericStr = /^(?:Rp\.?\s*|\$)?(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d+)?|\d+(?:[.,]\d+)?)$/i.test(trimmed);
  if (isNumericStr) {
    const cleanNumber = trimmed
      .replace(/^(?:Rp\.?\s*|\$)/i, "")
      .replace(/\./g, "")
      .replace(/,/g, ".");
    const num = parseFloat(cleanNumber);
    if (!isNaN(num)) return num;
  }

  const directNum = Number(trimmed);
  if (!isNaN(directNum) && trimmed !== "") {
    return directNum;
  }

  return trimmed;
}

/**
 * Infers column type and computes summary statistics from spreadsheet data
 */
function analyzeColumns(
  headers: string[],
  rows: Array<Record<string, string | number | null>>
): ColumnAnalysis[] {
  return headers.map((header, colIdx) => {
    const letter = indexToColumnLetter(colIdx);
    const nonNullValues = rows
      .map((r) => r[header])
      .filter((v): v is string | number => v !== null && v !== undefined && v !== "");

    const totalNonNull = nonNullValues.length;
    const uniqueVals = new Set(nonNullValues).size;

    if (totalNonNull === 0) {
      return {
        name: header,
        letter,
        type: "text",
        nonEmptyCount: 0,
        uniqueValues: 0,
      };
    }

    // Check how many values are numeric
    const numericVals = nonNullValues
      .map((v) => (typeof v === "number" ? v : parseCellValue(String(v))))
      .filter((v): v is number => typeof v === "number");

    // Check how many values match date patterns
    const dateRegex = /^(?:\d{4}[-/.]\d{1,2}[-/.]\d{1,2}|\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}|\w{3,9}\s+\d{1,2},?\s+\d{4})$/;
    const dateCount = nonNullValues.filter((v) => typeof v === "string" && dateRegex.test(v)).length;

    let type: InferredColumnType = "text";
    let stats: ColumnAnalysis["stats"] = undefined;

    if (numericVals.length / totalNonNull >= 0.7) {
      type = "number";
      const sum = numericVals.reduce((acc, curr) => acc + curr, 0);
      const min = Math.min(...numericVals);
      const max = Math.max(...numericVals);
      const avg = sum / numericVals.length;
      stats = { sum, min, max, avg };
    } else if (dateCount / totalNonNull >= 0.6) {
      type = "date";
    } else if (uniqueVals <= 25 && totalNonNull >= 3) {
      type = "category";
    }

    return {
      name: header,
      letter,
      type,
      nonEmptyCount: totalNonNull,
      uniqueValues: uniqueVals,
      stats,
    };
  });
}

/**
 * Fetches actual rows and data from Google Sheets API v4 for table preview & dynamic analysis
 */
export async function fetchSheetDataAndAnalysis(
  spreadsheetId: string,
  sheetTitle: string,
  accessToken: string,
  limit = 250
): Promise<SheetDataPayload> {
  const range = `${encodeURIComponent(sheetTitle)}!A1:ZZ${limit + 1}`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
    spreadsheetId
  )}/values/${range}?valueRenderOption=FORMATTED_VALUE`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to fetch spreadsheet data: ${res.status} ${errText}`);
  }

  const data = await res.json();
  const rawMatrix: string[][] = data.values || [];

  if (rawMatrix.length === 0) {
    return {
      spreadsheetId,
      sheetTitle,
      headers: [],
      rows: [],
      rawRows: [],
      totalRows: 0,
      columnAnalysis: [],
    };
  }

  const headers: string[] = rawMatrix[0].map((h, i) => (h ? String(h).trim() : `Col_${i + 1}`));
  const rawRows: string[][] = rawMatrix.slice(1);

  const rows: Array<Record<string, string | number | null>> = rawRows.map((rawRow) => {
    const rowObj: Record<string, string | number | null> = {};
    headers.forEach((header, colIdx) => {
      const rawCell = rawRow[colIdx] ?? "";
      rowObj[header] = parseCellValue(String(rawCell));
    });
    return rowObj;
  });

  const columnAnalysis = analyzeColumns(headers, rows);

  return {
    spreadsheetId,
    sheetTitle,
    headers,
    rows,
    rawRows,
    totalRows: rows.length,
    columnAnalysis,
  };
}
