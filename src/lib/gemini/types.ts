export type FieldStatus = "detected" | "uncertain" | "missing";

export interface ExtractedFieldValue {
  value: string | number | null;
  status: FieldStatus;
}

export interface ExtractedRow {
  [columnName: string]: ExtractedFieldValue;
}

export interface ExtractionResult {
  sheetTitle: string;
  columns: string[];
  rows: ExtractedRow[];
  rowCount: number;
  extractedAt: number;
}

export interface GeminiExtractionRequest {
  imageBase64: string;
  mimeType: string;
  columns: string[];
  sheetTitle?: string;
}
