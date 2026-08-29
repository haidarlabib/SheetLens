export interface SheetTabInfo {
  sheetId: number;
  title: string;
  index: number;
  rowCount?: number;
  columnCount?: number;
}

export interface SpreadsheetDetails {
  spreadsheetId: string;
  title: string;
  spreadsheetUrl: string;
  sheets: SheetTabInfo[];
}

export interface SheetColumnHeader {
  index: number;
  letter: string;
  name: string;
  valid: boolean;
}

export interface HeaderDiscoveryResult {
  spreadsheetId: string;
  sheetTitle: string;
  headers: SheetColumnHeader[];
  headerCount: number;
  hasEmptyHeaders: boolean;
  hasDuplicateHeaders: boolean;
  validationIssues: string[];
}

export interface ConnectedSpreadsheet {
  spreadsheetId: string;
  spreadsheetTitle: string;
  spreadsheetUrl: string;
  sheetId: number;
  sheetTitle: string;
  headers: SheetColumnHeader[];
  headerCount: number;
  connectedAt: number; // timestamp
}

export type InferredColumnType = "number" | "date" | "category" | "text" | "boolean";

export interface ColumnAnalysis {
  name: string;
  letter: string;
  type: InferredColumnType;
  nonEmptyCount: number;
  uniqueValues: number;
  stats?: {
    min?: number;
    max?: number;
    sum?: number;
    avg?: number;
  };
}

export interface SheetDataPayload {
  spreadsheetId: string;
  spreadsheetTitle?: string;
  sheetTitle: string;
  headers: string[];
  rows: Array<Record<string, string | number | null>>;
  rawRows: string[][];
  totalRows: number;
  columnAnalysis: ColumnAnalysis[];
}

/**
 * Converts zero-based column index to spreadsheet column letter (0 -> A, 25 -> Z, 26 -> AA)
 */
export function indexToColumnLetter(index: number): string {
  let letter = "";
  let temp = index;
  while (temp >= 0) {
    letter = String.fromCharCode((temp % 26) + 65) + letter;
    temp = Math.floor(temp / 26) - 1;
  }
  return letter;
}

/**
 * Parses a Google Spreadsheet ID from a full Google Sheets URL or a raw ID string
 */
export function extractSpreadsheetId(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  
  // Check for full Google Docs / Sheets URL: /spreadsheets/d/{spreadsheetId}
  const urlMatch = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (urlMatch && urlMatch[1]) {
    return urlMatch[1];
  }
  
  // Check for raw alphanumeric ID (typically 44 characters, minimum 20)
  if (/^[a-zA-Z0-9-_]{20,}$/.test(trimmed)) {
    return trimmed;
  }

  return null;
}
