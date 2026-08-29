import {
  GeminiExtractionRequest,
  ExtractionResult,
  ExtractedRow,
  ExtractedFieldValue,
} from "./types";

/**
 * Standardizes raw values from model into clean ExtractedFieldValue with confidence status
 */
function normalizeFieldValue(
  rawValue: unknown
): ExtractedFieldValue {
  if (rawValue === null || rawValue === undefined || rawValue === "" || rawValue === "null" || rawValue === "N/A") {
    return {
      value: null,
      status: "missing",
    };
  }

  // Handle number conversion for Indonesian currency / quantity strings (e.g. "Rp 15.000" -> 15000)
  if (typeof rawValue === "number") {
    return {
      value: rawValue,
      status: "detected",
    };
  }

  if (typeof rawValue === "string") {
    const trimmed = rawValue.trim();
    
    // Check if it's a numeric string with Indonesian / thousand separators: e.g. "15.000" or "Rp 25.000"
    const isCurrencyOrNumber = /^(?:Rp\.?\s*)?(\d{1,3}(?:\.\d{3})+(?:,\d+)?|\d+(?:,\d+)?)$/i.test(trimmed);
    if (isCurrencyOrNumber) {
      const sanitized = trimmed
        .replace(/^(?:Rp\.?\s*)/i, "")
        .replace(/\./g, "")
        .replace(/,/g, ".");
      const parsedNum = parseFloat(sanitized);
      if (!isNaN(parsedNum)) {
        return {
          value: parsedNum,
          status: "detected",
        };
      }
    }

    return {
      value: trimmed,
      status: "detected",
    };
  }

  return {
    value: String(rawValue),
    status: "detected",
  };
}

/**
 * Calls Google Gemini Vision API to extract structured rows based on dynamic user schema
 */
export async function extractDocumentData(
  request: GeminiExtractionRequest
): Promise<ExtractionResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not configured on the server. Please add your Gemini API key to .env.local."
    );
  }

  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const { imageBase64, mimeType, columns, sheetTitle = "Default Sheet" } = request;

  if (!columns || columns.length === 0) {
    throw new Error("No column headers provided for extraction.");
  }

  const systemInstruction = `You are a high-precision document extraction engine for SheetLens.
Your task is to analyze the photographed document (such as a receipt, invoice, bill, delivery order, or statement) and map all relevant information into structured rows matching the user's exact spreadsheet column headers.

USER'S EXACT SPREADSHEET COLUMNS:
${JSON.stringify(columns, null, 2)}

STRICT EXTRACTION RULES:
1. Output format MUST be a valid JSON object with a single top-level key "rows", which is an array of row objects.
2. Every row object in "rows" MUST contain EXACTLY the keys listed in the user's columns above.
3. PRESERVE EXACT COLUMN STRINGS: Do NOT translate, normalize, alter spelling, or rename any column header.
4. DO NOT INVENT COLUMNS: Only the columns specified in the list are allowed.
5. MULTIPLE LINE ITEMS: If the document contains multiple items/products/transactions (e.g. items on a grocery receipt or multi-line invoice), create a separate row object for each item. Repeat document-level information (e.g. Invoice Date, Store Name, Invoice Number) across rows if those columns are present in the user's schema.
6. MISSING INFORMATION: If the document does not contain information for a column, set its value to null. Do NOT guess or hallucinate.
7. LANGUAGE & NUMBERS: The document may be in Indonesian, English, or mixed. Preserve Indonesian number formats intelligently (e.g. 10.000 or Rp 50.000 should be numeric 10000 and 50000 where appropriate).
8. Return ONLY clean JSON without markdown code fences or conversational text.`;

  const promptText = `Analyze this document image and extract all records matching the exact schema columns: ${JSON.stringify(
    columns
  )}. Return JSON with {"rows": [...]}.`;

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model
  )}:generateContent?key=${apiKey}`;

  const payload = {
    contents: [
      {
        role: "user",
        parts: [
          { text: promptText },
          {
            inline_data: {
              mime_type: mimeType,
              data: imageBase64,
            },
          },
        ],
      },
    ],
    system_instruction: {
      parts: [{ text: systemInstruction }],
    },
    generation_config: {
      response_mime_type: "application/json",
      temperature: 0.1,
    },
  };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Gemini API error response:", response.status, errorText);
    if (response.status === 400) {
      throw new Error("Invalid image format or request sent to Gemini.");
    }
    if (response.status === 403 || response.status === 401) {
      throw new Error("Gemini API authentication failed. Please verify your GEMINI_API_KEY.");
    }
    if (response.status === 429) {
      throw new Error("Gemini API rate limit exceeded. Please wait a moment and try again.");
    }
    throw new Error(`Gemini Vision extraction failed (${response.status}).`);
  }

  const data = await response.json();
  const rawContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!rawContent) {
    throw new Error("Gemini did not return any content for this document.");
  }

  // Parse structured JSON output
  let parsedJson: { rows?: Array<Record<string, unknown>> } | Array<Record<string, unknown>>;
  try {
    const cleanText = rawContent
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();
    parsedJson = JSON.parse(cleanText);
  } catch (err) {
    console.error("Failed to parse Gemini JSON output:", rawContent, err);
    throw new Error("The AI returned a malformed response. Please try re-scanning.");
  }

  // Normalize rows array
  let rawRows: Array<Record<string, unknown>> = [];
  if (Array.isArray(parsedJson)) {
    rawRows = parsedJson;
  } else if (parsedJson && Array.isArray(parsedJson.rows)) {
    rawRows = parsedJson.rows;
  } else if (typeof parsedJson === "object" && parsedJson !== null) {
    // If model returned a single row object instead of an array
    rawRows = [parsedJson as Record<string, unknown>];
  }

  if (rawRows.length === 0) {
    // Return at least one row containing all columns mapped to null
    const emptyRow: ExtractedRow = {};
    for (const col of columns) {
      emptyRow[col] = { value: null, status: "missing" };
    }
    rawRows = [emptyRow];
  }

  // Strictly validate and filter each row against the user's exact columns
  const validatedRows: ExtractedRow[] = rawRows.map((rawRow) => {
    const cleanRow: ExtractedRow = {};
    for (const col of columns) {
      // Find value matching exact key, or case-insensitive fallback key from model
      let rawVal = rawRow[col];
      if (rawVal === undefined) {
        const lowerCol = col.toLowerCase();
        const foundKey = Object.keys(rawRow).find((k) => k.toLowerCase() === lowerCol);
        if (foundKey) {
          rawVal = rawRow[foundKey];
        }
      }

      cleanRow[col] = normalizeFieldValue(rawVal);
    }
    return cleanRow;
  });

  return {
    sheetTitle,
    columns,
    rows: validatedRows,
    rowCount: validatedRows.length,
    extractedAt: Date.now(),
  };
}
