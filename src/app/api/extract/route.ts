import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { extractDocumentData } from "@/lib/gemini/client";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/jpg",
]);

const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB

export async function POST(request: NextRequest) {
  // 1. Authenticate user session
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json(
      { error: "Unauthorized. Please sign in to Google." },
      { status: 401 }
    );
  }

  // 2. Validate active connected spreadsheet schema
  const connectedSheet = session.connectedSheet;
  if (!connectedSheet) {
    return NextResponse.json(
      {
        error:
          "No Google Spreadsheet connected. Please select a spreadsheet in your workspace before scanning documents.",
      },
      { status: 400 }
    );
  }

  const validColumns = (connectedSheet.headers || [])
    .filter((h) => h.valid)
    .map((h) => h.name);

  if (validColumns.length === 0) {
    return NextResponse.json(
      {
        error:
          "The connected spreadsheet has no valid column headers. Please check row 1 in your Google Sheet.",
      },
      { status: 400 }
    );
  }

  try {
    // 3. Parse and validate image from multipart form data
    const formData = await request.formData();
    const file = formData.get("image") as File | null;

    if (!file || typeof file === "string") {
      return NextResponse.json(
        { error: "No image document was provided." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: "Image file exceeds maximum allowable size (15MB)." },
        { status: 400 }
      );
    }

    const mimeType = file.type || "image/jpeg";
    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      return NextResponse.json(
        {
          error:
            "Unsupported file format. Please upload a standard image (JPEG, PNG, WebP).",
        },
        { status: 400 }
      );
    }

    // 4. Convert file buffer to Base64
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const imageBase64 = buffer.toString("base64");

    // 5. Call Gemini Vision with dynamic schema
    const result = await extractDocumentData({
      imageBase64,
      mimeType,
      columns: validColumns,
      sheetTitle: connectedSheet.sheetTitle,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (err: unknown) {
    console.error("[Document Extraction API]", err);
    let message = "Document extraction failed. Please try again with a clear photo.";
    let status = 500;

    if (err instanceof Error) {
      if (err.message.startsWith("INVALID_API_KEY")) {
        message = "Gemini API key is invalid or unauthorized. Please verify your GEMINI_API_KEY.";
        status = 401;
      } else if (err.message.startsWith("QUOTA_ERROR")) {
        message = "Gemini API rate limit reached. Please wait a moment and try again.";
        status = 429;
      } else if (err.message.startsWith("IMAGE_PAYLOAD_ERROR")) {
        message = "Image format not supported or corrupted. Please upload a clear JPG, PNG, or WebP photo.";
        status = 400;
      } else if (err.message.startsWith("GEMINI_SERVICE_UNAVAILABLE")) {
        message = "Gemini AI service is temporarily experiencing high traffic. Please retry in a few seconds.";
        status = 503;
      } else if (err.message.startsWith("MODEL_NOT_FOUND")) {
        message = "The configured Gemini Vision model is not available for this API key.";
        status = 500;
      }
    }

    return NextResponse.json({ error: message }, { status });
  }
}
