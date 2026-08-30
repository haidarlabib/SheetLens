"use client";

import React, { useState, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Camera,
  UploadSimple,
  ArrowCounterClockwise,
  Sparkle,
  WarningCircle,
  Table,
  ArrowSquareOut,
  Hash,
  Calendar,
  Tag,
  TextT,
  CheckCircle,
  Lightbulb,
} from "@phosphor-icons/react";
import { ConnectedSpreadsheet, InferredColumnType } from "@/lib/sheets/types";
import { ExtractionResult } from "@/lib/gemini/types";
import { compressAndResizeImage } from "@/lib/utils/image";
import { ExtractionReview } from "./ExtractionReview";
import { DoubleBezelCard } from "@/components/ui/DoubleBezelCard";
import { LdrsLoader } from "@/components/ui/LdrsLoader";

interface ScanInstrumentProps {
  connectedSheet: ConnectedSpreadsheet | null;
}

type ScanStage = "idle" | "preview" | "processing" | "review";

function ColumnTypeIcon({ type }: { type: InferredColumnType }) {
  switch (type) {
    case "number":
      return <Hash size={11} className="text-emerald-500 shrink-0" />;
    case "date":
      return <Calendar size={11} className="text-sky-500 shrink-0" />;
    case "category":
      return <Tag size={11} className="text-amber-500 shrink-0" />;
    default:
      return <TextT size={11} className="text-muted shrink-0" />;
  }
}

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
  const [isDragOver, setIsDragOver] = useState(false);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle image capture or upload
  const handleFileSelect = useCallback(async (file: File) => {
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
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Drag and drop handlers for desktop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
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
      <div className="max-w-lg mx-auto py-8 text-left animate-in fade-in duration-200">
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
            Document extraction maps physical receipts and invoices directly into your specific spreadsheet columns. Please connect or create a spreadsheet before scanning.
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
    <div className="space-y-6 text-left animate-in fade-in duration-200">
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

      {/* DESKTOP SPLIT WORKSPACE: 8 COLS (CAPTURE INSTRUMENT) / 4 COLS (SCHEMA & CONTEXT) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT / MAIN CAPTURE AREA (lg:col-span-8) */}
        <div className="lg:col-span-8 space-y-4">
          {stage === "idle" && (
            <DoubleBezelCard glow className="p-6 sm:p-8">
              {/* Optical Document Viewfinder with Dropzone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative w-full aspect-[4/3] sm:aspect-[16/10] rounded-2xl border transition-all duration-200 flex flex-col items-center justify-center p-6 mb-6 overflow-hidden ${
                  isDragOver
                    ? "bg-accent/10 border-accent scale-[1.01]"
                    : "bg-surface-inner border-dashed border-border hover:border-border-strong"
                }`}
              >
                {/* 4 Precision Optical Corner Reticles */}
                <div className="absolute top-4 left-4 w-5 h-5 border-t-2 border-l-2 border-accent rounded-tl-sm" />
                <div className="absolute top-4 right-4 w-5 h-5 border-t-2 border-r-2 border-accent rounded-tr-sm" />
                <div className="absolute bottom-4 left-4 w-5 h-5 border-b-2 border-l-2 border-accent rounded-bl-sm" />
                <div className="absolute bottom-4 right-4 w-5 h-5 border-b-2 border-r-2 border-accent rounded-br-sm" />

                {/* Subtle Scanning Beam Animation */}
                <div className="absolute inset-x-4 top-0 h-1 bg-gradient-to-r from-transparent via-accent/40 to-transparent animate-[pulse_3s_ease-in-out_infinite]" />

                <div className="w-14 h-14 rounded-2xl bg-surface border border-border flex items-center justify-center text-accent mb-3 shadow-sm">
                  <Camera size={28} weight="bold" />
                </div>

                <div className="text-sm font-semibold text-foreground font-sans mb-1 text-center">
                  Align physical document inside frame
                </div>
                <div className="text-xs font-mono text-muted max-w-xs text-center">
                  Receipts · Invoices · Delivery Notes · Paper Slips
                </div>
                <div className="text-[11px] font-mono text-accent/90 mt-2 hidden sm:block">
                  Drag & drop an image or use the buttons below
                </div>
              </div>

              {/* Dual Action Triggers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md mx-auto">
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
                  className="py-3.5 px-4 rounded-xl bg-surface hover:bg-border border border-border text-foreground text-xs font-semibold active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <UploadSimple size={16} />
                  <span>Upload Image</span>
                </button>
              </div>
            </DoubleBezelCard>
          )}

          {stage === "preview" && previewUrl && (
            <DoubleBezelCard glow className="p-4 sm:p-6 space-y-4">
              {/* Document Image Inspection Frame */}
              <div className="relative w-full aspect-[4/3] sm:aspect-[16/10] rounded-2xl bg-surface-inner border border-border overflow-hidden flex items-center justify-center">
                <Image
                  src={previewUrl}
                  alt="Document Preview"
                  fill
                  className="object-contain p-3"
                  unoptimized
                />

                {imageMeta && (
                  <div className="absolute bottom-4 left-4 px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur-md text-[10.5px] font-mono text-white/95 border border-white/10 shadow-sm">
                    {imageMeta.width} × {imageMeta.height} px · {imageMeta.sizeKb} KB
                  </div>
                )}
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center gap-3">
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
                  <span>Extract Document Data (Gemini Vision)</span>
                </button>
              </div>
            </DoubleBezelCard>
          )}

          {stage === "processing" && (
            <DoubleBezelCard glow className="py-20 flex flex-col items-center justify-center text-center space-y-4">
              <LdrsLoader variant="quantum" size={44} label="Processing document" />

              <div className="space-y-1.5 max-w-sm">
                <div className="text-sm font-semibold text-foreground font-sans">
                  {processingStage === "reading" && "Reading Document with Gemini Vision..."}
                  {processingStage === "mapping" && "Mapping Fields to Spreadsheet Columns..."}
                  {processingStage === "validating" && "Verifying Dynamic Schema Values..."}
                </div>
                <div className="text-xs font-mono text-muted">
                  Mapping directly into: {connectedSheet.headers.map((h) => h.name).join(" · ")}
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

        {/* RIGHT / CONTEXT & TARGET SCHEMA SIDEBAR (lg:col-span-4) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Target Spreadsheet Identity */}
          <DoubleBezelCard className="space-y-3">
            <div className="flex items-center justify-between border-b border-border pb-2.5">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2 h-2 rounded-full bg-accent animate-pulse shrink-0" />
                <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-foreground truncate">
                  Target Spreadsheet
                </h2>
              </div>

              <a
                href={connectedSheet.spreadsheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Open in Google Sheets"
                className="p-1 rounded-md text-muted hover:text-foreground transition-colors shrink-0"
              >
                <ArrowSquareOut size={13} />
              </a>
            </div>

            <div className="space-y-1.5 text-xs font-mono">
              <div className="text-foreground font-semibold truncate">
                {connectedSheet.spreadsheetTitle}
              </div>
              <div className="text-muted text-[11px] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Tab: {connectedSheet.sheetTitle}</span>
              </div>
            </div>

            {/* Target Columns Mapping Pill List */}
            <div className="border-t border-border pt-3 space-y-2">
              <div className="text-[10.5px] font-mono text-muted uppercase">
                Schema Target Columns ({connectedSheet.headers.length})
              </div>

              <div className="space-y-1.5 max-h-[38vh] overflow-y-auto pr-1">
                {connectedSheet.headers.map((h, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-lg bg-surface-inner border border-border text-xs font-mono"
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="w-4.5 h-4.5 rounded bg-surface-muted border border-border text-[9.5px] font-bold text-muted flex items-center justify-center shrink-0">
                        {h.letter || String.fromCharCode(65 + idx)}
                      </span>
                      <span className="text-foreground truncate max-w-[160px]">
                        {h.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-muted">
                      <CheckCircle size={12} weight="fill" className="text-emerald-500" />
                      <span>Ready</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </DoubleBezelCard>

          {/* Precision Capture Tips */}
          <DoubleBezelCard className="space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
              <Lightbulb size={14} className="text-amber-500" />
              <span>Capture Quality Tips</span>
            </div>

            <ul className="text-[11px] font-mono text-muted space-y-1.5">
              <li className="flex items-start gap-1.5">
                <CheckCircle size={12} weight="fill" className="text-emerald-500 shrink-0 mt-0.5" />
                <span>Place receipt on a flat surface with high contrast.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle size={12} weight="fill" className="text-emerald-500 shrink-0 mt-0.5" />
                <span>Ensure line items and totals are well-lit and legible.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle size={12} weight="fill" className="text-emerald-500 shrink-0 mt-0.5" />
                <span>Gemini automatically maps keys to your spreadsheet headers.</span>
              </li>
            </ul>
          </DoubleBezelCard>
        </div>
      </div>
    </div>
  );
}
