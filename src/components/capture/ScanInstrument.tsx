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
  Lightbulb,
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

function ColumnBadge({ name, letter }: { name: string; letter: string }) {
  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-inner border border-border text-xs font-mono">
      <span className="text-[10px] font-bold text-muted w-3.5 text-center shrink-0">
        {letter}
      </span>
      <span className="text-foreground font-medium truncate max-w-[130px]">
        {name}
      </span>
    </div>
  );
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
      setErrorMessage("Gagal memproses gambar. Silakan gunakan foto yang jelas.");
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
        throw new Error(json.error || "Gagal mengekstraksi data dokumen.");
      }

      setExtractionResult(json.data);
      setStage("review");
    } catch (err: unknown) {
      console.error("Extraction error:", err);
      const msg =
        err instanceof Error
          ? err.message
          : "Gagal mengekstraksi data. Silakan coba lagi dengan foto yang lebih terang dan jelas.";
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
            <div className="w-8 h-8 rounded-xl bg-surface-muted border border-border flex items-center justify-center text-accent">
              <Table size={16} />
            </div>
            <h1 className="text-sm font-semibold text-foreground">
              Hubungkan Spreadsheet Terlebih Dahulu
            </h1>
          </div>
          <p className="text-xs text-muted leading-relaxed mb-4">
            Ekstraksi dokumen memetakan nota, invoice, atau struk fisik langsung ke kolom Google Spreadsheet Anda. Silakan hubungkan spreadsheet target terlebih dahulu.
          </p>
          <Link
            href="/sheets"
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-foreground text-background text-xs font-semibold hover:opacity-90 active:scale-[0.98] transition-all text-center cursor-pointer shadow-sm"
          >
            <span>Hubungkan Spreadsheet</span>
          </Link>
        </DoubleBezelCard>
      </div>
    );
  }

  return (
    <div className="space-y-5 text-left animate-in fade-in duration-200 max-w-5xl mx-auto">
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
          className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-300 text-xs flex items-center gap-2.5 font-mono"
        >
          <WarningCircle size={16} className="text-rose-500 shrink-0" />
          <span className="leading-snug">{errorMessage}</span>
        </div>
      )}

      {/* MAIN CAPTURE WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* PRIMARY CAPTURE AREA (lg:col-span-8) */}
        <div className="lg:col-span-8 space-y-4">
          {stage === "idle" && (
            <DoubleBezelCard glow className="p-5 sm:p-7">
              {/* Precision Optical Document Viewfinder with Drag-and-Drop */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => cameraInputRef.current?.click()}
                className={`relative w-full aspect-[4/3] sm:aspect-[16/10] rounded-2xl border transition-all duration-200 flex flex-col items-center justify-center p-6 mb-5 overflow-hidden cursor-pointer group ${
                  isDragOver
                    ? "bg-accent/10 border-accent scale-[1.01]"
                    : "bg-surface-inner border-dashed border-border hover:border-accent/50 hover:bg-surface-muted/30"
                }`}
              >
                {/* 4 Precision Corner Reticles */}
                <div className="absolute top-3.5 left-3.5 w-4 h-4 border-t-2 border-l-2 border-accent/80 rounded-tl-sm transition-transform group-hover:scale-110" />
                <div className="absolute top-3.5 right-3.5 w-4 h-4 border-t-2 border-r-2 border-accent/80 rounded-tr-sm transition-transform group-hover:scale-110" />
                <div className="absolute bottom-3.5 left-3.5 w-4 h-4 border-b-2 border-l-2 border-accent/80 rounded-bl-sm transition-transform group-hover:scale-110" />
                <div className="absolute bottom-3.5 right-3.5 w-4 h-4 border-b-2 border-r-2 border-accent/80 rounded-br-sm transition-transform group-hover:scale-110" />

                {/* Hero Icon */}
                <div className="w-12 h-12 rounded-xl bg-surface border border-border flex items-center justify-center text-accent mb-3 shadow-xs transition-transform group-hover:scale-105">
                  <Camera size={24} weight="bold" />
                </div>

                <div className="text-xs sm:text-sm font-semibold text-foreground font-sans mb-1 text-center">
                  Posisikan dokumen atau struk di dalam bingkai
                </div>
                <div className="text-[11px] font-mono text-muted max-w-xs text-center leading-relaxed">
                  Struk Belanja · Invoice · Nota Penjualan · Catatan
                </div>
                <div className="text-[10px] font-mono text-accent mt-2 hidden sm:block">
                  Klik untuk ambil foto, atau tarik file ke sini
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md mx-auto">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="py-3 px-4 rounded-xl bg-foreground text-background text-xs font-semibold hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <Camera size={16} weight="bold" className="text-accent" />
                  <span>Ambil Foto</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="py-3 px-4 rounded-xl bg-surface hover:bg-surface-muted border border-border text-foreground text-xs font-semibold active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <UploadSimple size={16} />
                  <span>Upload Gambar</span>
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
                  alt="Pratinjau Dokumen"
                  fill
                  className="object-contain p-3"
                  unoptimized
                />

                {imageMeta && (
                  <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg bg-black/80 backdrop-blur-md text-[10px] font-mono text-white/90 border border-white/10 shadow-xs">
                    {imageMeta.width} × {imageMeta.height} px · {imageMeta.sizeKb} KB
                  </div>
                )}
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleReset}
                  className="py-3 px-4 rounded-xl bg-surface hover:bg-surface-muted border border-border text-foreground text-xs font-semibold active:scale-[0.98] transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowCounterClockwise size={14} />
                  <span>Foto Ulang</span>
                </button>

                <button
                  type="button"
                  onClick={handleExtract}
                  className="flex-1 py-3 px-4 rounded-xl bg-foreground text-background text-xs font-semibold hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <Sparkle size={15} weight="fill" className="text-accent" />
                  <span>Ekstrak Data Dokumen</span>
                </button>
              </div>
            </DoubleBezelCard>
          )}

          {stage === "processing" && (
            <DoubleBezelCard glow className="py-20 flex flex-col items-center justify-center text-center space-y-4">
              <LdrsLoader variant="quantum" size={42} label="Memproses dokumen" />

              <div className="space-y-1.5 max-w-sm">
                <div className="text-sm font-semibold text-foreground font-sans">
                  {processingStage === "reading" && "Membaca teks dokumen..."}
                  {processingStage === "mapping" && "Mencocokkan kolom spreadsheet..."}
                  {processingStage === "validating" && "Memvalidasi hasil ekstraksi..."}
                </div>
                <div className="text-xs font-mono text-muted">
                  Target: {connectedSheet.headers.map((h) => h.name).join(" · ")}
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

        {/* SECONDARY CONTEXT & TARGET SPREADSHEET (lg:col-span-4) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Target Spreadsheet Identity Card */}
          <DoubleBezelCard className="space-y-3">
            <div className="flex items-center justify-between border-b border-border pb-2.5">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-foreground truncate">
                  Target Spreadsheet
                </h2>
              </div>

              <a
                href={connectedSheet.spreadsheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Buka di Google Sheets"
                className="text-muted hover:text-foreground transition-colors p-1 rounded-md"
              >
                <ArrowSquareOut size={13} />
              </a>
            </div>

            <div className="space-y-1 text-xs font-mono">
              <div className="text-foreground font-semibold truncate">
                {connectedSheet.spreadsheetTitle}
              </div>
              <div className="text-muted text-[11px] flex items-center gap-1.5">
                <span>Tab: {connectedSheet.sheetTitle}</span>
                <span>·</span>
                <span>{connectedSheet.headers.length} Kolom</span>
              </div>
            </div>

            {/* Target Columns Mapping Chips */}
            <div className="border-t border-border pt-2.5 space-y-1.5">
              <div className="text-[10px] font-mono text-muted uppercase">
                Kolom Target
              </div>

              <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
                {connectedSheet.headers.map((h, idx) => (
                  <ColumnBadge
                    key={idx}
                    letter={h.letter || String.fromCharCode(65 + idx)}
                    name={h.name}
                  />
                ))}
              </div>
            </div>
          </DoubleBezelCard>

          {/* Quality Tips Card */}
          <DoubleBezelCard className="space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <Lightbulb size={14} className="text-amber-500" />
              <span>Tips Hasil Optimal</span>
            </div>

            <ul className="text-[11px] font-mono text-muted space-y-1.5">
              <li className="flex items-start gap-1.5">
                <span className="text-accent font-bold">·</span>
                <span>Letakkan dokumen di atas permukaan yang rata.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-accent font-bold">·</span>
                <span>Pastikan pencahayaan cukup dan teks tidak buram.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-accent font-bold">·</span>
                <span>Data otomatis disesuaikan dengan format kolom Anda.</span>
              </li>
            </ul>
          </DoubleBezelCard>
        </div>
      </div>
    </div>
  );
}
