"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Camera,
  UploadSimple,
  ArrowCounterClockwise,
  Sparkle,
  WarningCircle,
  Table,
} from "@phosphor-icons/react";
import { ConnectedSpreadsheet } from "@/lib/sheets/types";
import { ExtractionResult } from "@/lib/gemini/types";
import { compressAndResizeImage } from "@/lib/utils/image";
import { ExtractionReview } from "./ExtractionReview";
import { DoubleBezelCard } from "@/components/ui/DoubleBezelCard";
import { LdrsLoader } from "@/components/ui/LdrsLoader";

interface ScanInstrumentProps {
  connectedSheet: ConnectedSpreadsheet | null;
}

type ScanStage = "idle" | "preview" | "processing" | "review";

export function ScanInstrument({ connectedSheet }: ScanInstrumentProps) {
  const [stage, setStage] = useState<ScanStage>("idle");
  const [selectedBlob, setSelectedBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageMeta, setImageMeta] = useState<{
    width: number;
    height: number;
    sizeKb: number;
  } | null>(null);

  const [processingStage, setProcessingStage] = useState<
    "reading" | "mapping" | "validating"
  >("reading");
  const [extractionResult, setExtractionResult] =
    useState<ExtractionResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle image capture or upload
  const handleFileSelect = async (file: File) => {
    setErrorMessage(null);
    try {
      // Compress and resize client-side
      const compressed = await compressAndResizeImage(file, 1600, 0.85);

      setSelectedBlob(compressed.blob);
      setPreviewUrl(compressed.dataUrl);
      setImageMeta({
        width: compressed.width,
        height: compressed.height,
        sizeKb: Math.round(compressed.blob.size / 1024),
      });
      setStage("preview");
    } catch (err) {
      console.error("Image processing error:", err);
      setErrorMessage("Unable to process the image. Please select a valid photo.");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Perform Gemini Vision Extraction
  const handleExtract = async () => {
    if (!selectedBlob) return;

    setStage("processing");
    setErrorMessage(null);
    setProcessingStage("reading");

    try {
      const mappingTimer = setTimeout(() => {
        setProcessingStage("mapping");
      }, 1200);

      const validatingTimer = setTimeout(() => {
        setProcessingStage("validating");
      }, 2400);

      const formData = new FormData();
      formData.append("image", selectedBlob, "document.jpg");

      const res = await fetch("/api/extract", {
        method: "POST",
        body: formData,
      });

      clearTimeout(mappingTimer);
      clearTimeout(validatingTimer);

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || "Document extraction failed.");
      }

      setExtractionResult(json.data);
      setStage("review");
    } catch (err: unknown) {
      console.error("Extraction error:", err);
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to extract data. Please try again with a clearer photo.";
      setErrorMessage(msg);
      setStage("preview");
    }
  };

  const handleReset = () => {
    setSelectedBlob(null);
    setPreviewUrl(null);
    setImageMeta(null);
    setExtractionResult(null);
    setErrorMessage(null);
    setStage("idle");
  };

  if (!connectedSheet) {
    return (
      <div className="max-w-lg mx-auto py-8 text-left">
        <DoubleBezelCard glow className="border-dashed">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-surface-muted border border-border flex items-center justify-center text-accent">
              <Table size={16} />
            </div>
            <h1 className="text-sm font-semibold text-foreground">
              Connect a Spreadsheet First
            </h1>
          </div>
          <p className="text-xs text-muted leading-relaxed mb-4">
            Document extraction maps physical receipts and invoices into your specific spreadsheet columns. Please connect or create a spreadsheet before scanning.
          </p>
          <Link
            href="/sheets"
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-foreground text-background text-xs font-semibold hover:opacity-90 transition-all text-center"
          >
            <span>Set Up Spreadsheet Target</span>
          </Link>
        </DoubleBezelCard>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4 text-left animate-in fade-in duration-200">
      {/* Hidden File Inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleInputChange}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleInputChange}
      />

      {/* Top Instrument Status Strip */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          <span className="text-xs font-mono font-bold text-foreground">
            {connectedSheet.spreadsheetTitle}
          </span>
          <span className="text-[10px] font-mono text-muted bg-surface px-1.5 py-0.5 rounded border border-border">
            {connectedSheet.sheetTitle}
          </span>
        </div>

        <span className="text-[10.5px] font-mono text-muted">
          {connectedSheet.headers.length} Target Columns
        </span>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div
          role="alert"
          className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-300 text-xs flex items-center gap-2"
        >
          <WarningCircle size={15} className="text-rose-500 shrink-0" />
          <span className="leading-snug">{errorMessage}</span>
        </div>
      )}

      {/* Main Viewport depending on stage */}
      {stage === "idle" && (
        <DoubleBezelCard glow className="p-6 sm:p-8 flex flex-col items-center justify-center text-center">
          {/* Optical Document Framing Reticle */}
          <div className="relative w-full max-w-sm aspect-[4/3] rounded-2xl bg-surface-inner border border-dashed border-border flex flex-col items-center justify-center p-6 mb-6">
            {/* 4 Optical Framing Corners */}
            <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-accent rounded-tl-sm" />
            <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-accent rounded-tr-sm" />
            <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-accent rounded-bl-sm" />
            <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-accent rounded-br-sm" />

            <div className="w-12 h-12 rounded-2xl bg-surface-muted border border-border flex items-center justify-center text-accent mb-3 shadow-xs">
              <Camera size={24} weight="bold" />
            </div>

            <div className="text-xs font-semibold text-foreground mb-1">
              Align physical document inside frame
            </div>
            <div className="text-[11px] font-mono text-muted max-w-[200px]">
              Receipts · Invoices · Delivery Notes
            </div>
          </div>

          {/* Dual Action Controls: Mobile Camera or File Picker */}
          <div className="w-full max-w-sm grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="py-3.5 px-4 rounded-xl bg-foreground text-background text-xs font-semibold hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <Camera size={16} weight="bold" className="text-accent" />
              <span>Capture Photo</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="py-3 px-4 rounded-xl bg-surface hover:bg-border border border-border text-foreground text-xs font-semibold active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <UploadSimple size={16} />
              <span>Upload Image</span>
            </button>
          </div>
        </DoubleBezelCard>
      )}

      {stage === "preview" && previewUrl && (
        <DoubleBezelCard glow className="p-4 sm:p-5 space-y-4">
          {/* Image Inspection View */}
          <div className="relative w-full aspect-[4/3] rounded-2xl bg-surface-inner border border-border overflow-hidden flex items-center justify-center">
            <Image
              src={previewUrl}
              alt="Document Preview"
              fill
              className="object-contain p-2"
              unoptimized
            />

            {imageMeta && (
              <div className="absolute bottom-3 left-3 px-2 py-1 rounded-md bg-black/70 backdrop-blur-md text-[10px] font-mono text-white/90 border border-white/10">
                {imageMeta.width} × {imageMeta.height} · {imageMeta.sizeKb} KB
              </div>
            )}
          </div>

          {/* Action Bar */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="py-3 px-4 rounded-xl bg-surface hover:bg-border border border-border text-foreground text-xs font-semibold active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowCounterClockwise size={14} />
              <span>Retake</span>
            </button>

            <button
              type="button"
              onClick={handleExtract}
              className="flex-1 py-3 px-4 rounded-xl bg-foreground text-background text-xs font-semibold hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <Sparkle size={15} weight="fill" className="text-accent" />
              <span>Extract Document Data</span>
            </button>
          </div>
        </DoubleBezelCard>
      )}

      {stage === "processing" && (
        <DoubleBezelCard glow className="py-16 flex flex-col items-center justify-center text-center space-y-4">
          <LdrsLoader variant="quantum" size={42} label="Processing document" />

          <div className="space-y-1">
            <div className="text-sm font-semibold text-foreground">
              {processingStage === "reading" && "Reading Document with Gemini Vision..."}
              {processingStage === "mapping" && "Mapping Fields to Spreadsheet Columns..."}
              {processingStage === "validating" && "Verifying Dynamic Schema Values..."}
            </div>
            <div className="text-xs font-mono text-muted">
              Targeting: {connectedSheet.headers.map((h) => h.name).join(" · ")}
            </div>
          </div>
        </DoubleBezelCard>
      )}

      {stage === "review" && extractionResult && previewUrl && (
        <ExtractionReview
          imagePreviewUrl={previewUrl}
          extractionResult={extractionResult}
          onScanAnother={handleReset}
          onRetryExtraction={handleExtract}
        />
      )}
    </div>
  );
}
