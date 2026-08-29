"use client";

import React, { useState, useRef } from "react";
import {
  Camera,
  FolderOpen,
  X,
  ArrowsClockwise,
  WarningCircle,
  CircleNotch,
  ArrowRight,
  Sparkle,
  CheckCircle,
} from "@phosphor-icons/react";
import { ExtractionResult } from "@/lib/gemini/types";
import { compressAndResizeImage } from "@/lib/utils/image";
import { ExtractionReview } from "./ExtractionReview";

interface DocumentCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetSheetTitle?: string;
}

type CaptureStage = "capture" | "preview" | "extracting" | "review" | "error";

export function DocumentCaptureModal({
  isOpen,
  onClose,
  targetSheetTitle = "Connected Spreadsheet",
}: DocumentCaptureModalProps) {
  const [stage, setStage] = useState<CaptureStage>("capture");
  const [selectedFile, setSelectedFile] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageMeta, setImageMeta] = useState<{ width: number; height: number; sizeKb: number } | null>(null);
  const [extractionProgressText, setExtractionProgressText] = useState("Preparing image...");
  const [extractionResult, setExtractionResult] = useState<ExtractionResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Hidden native file input refs
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  // Reset modal state
  const handleReset = () => {
    setStage("capture");
    setSelectedFile(null);
    setPreviewUrl(null);
    setImageMeta(null);
    setExtractionResult(null);
    setErrorMessage(null);
  };

  // Process selected image file
  const handleProcessFile = async (file: File) => {
    setErrorMessage(null);
    try {
      const { blob, dataUrl, width, height } = await compressAndResizeImage(file);
      setSelectedFile(blob);
      setPreviewUrl(dataUrl);
      setImageMeta({
        width,
        height,
        sizeKb: Math.round(blob.size / 1024),
      });
      setStage("preview");
    } catch (err) {
      console.error("Failed to process image:", err);
      setErrorMessage("Could not load image. Please select a valid photo.");
    }
  };

  // Handle file input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
    // Clear value so the same file can be re-selected if needed
    e.target.value = "";
  };

  // Handle Drag & Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      handleProcessFile(file);
    } else {
      setErrorMessage("Please drop an image file (JPEG, PNG, WebP).");
    }
  };

  // Perform AI Extraction
  const handleRunExtraction = async () => {
    if (!selectedFile) return;

    setStage("extracting");
    setErrorMessage(null);
    setExtractionProgressText("Preparing image document...");

    try {
      const timer1 = setTimeout(() => {
        setExtractionProgressText("Reading document with Gemini Vision...");
      }, 700);

      const timer2 = setTimeout(() => {
        setExtractionProgressText(`Mapping fields to "${targetSheetTitle}" columns...`);
      }, 2000);

      const formData = new FormData();
      formData.append("image", selectedFile, "document.jpg");

      const res = await fetch("/api/extract", {
        method: "POST",
        body: formData,
      });

      clearTimeout(timer1);
      clearTimeout(timer2);

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || "Document extraction failed.");
      }

      setExtractionResult(json.data);
      setStage("review");
    } catch (err: unknown) {
      console.error("Extraction error:", err);
      const msg = err instanceof Error ? err.message : "Couldn't read this document.";
      setErrorMessage(msg);
      setStage("error");
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="capture-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-xl rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[var(--surface-muted)] border border-[var(--border)] flex items-center justify-center text-[var(--foreground)]">
              <Camera size={15} />
            </div>
            <h2 id="capture-modal-title" className="text-sm font-semibold text-[var(--foreground)]">
              {stage === "review" ? "Extraction Review" : "Capture Document"}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-full text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-muted)] transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-left">
          {/* Hidden HTML5 File Inputs */}
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
            accept="image/jpeg,image/png,image/webp,image/heic"
            className="hidden"
            onChange={handleInputChange}
          />

          {/* STAGE 1: CAPTURE / SELECT */}
          {stage === "capture" && (
            <div className="space-y-4">
              {/* Framing Guide Zone / Dropzone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative w-full aspect-[4/3] sm:aspect-[16/10] rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center p-6 text-center overflow-hidden ${
                  isDragging
                    ? "border-[var(--accent)] bg-[var(--accent-subtle)]"
                    : "border-[var(--border)] bg-[var(--surface-inner)]"
                }`}
              >
                {/* 4 Minimalist Corner Brackets */}
                <div className="absolute top-4 left-4 w-5 h-5 border-t-2 border-l-2 border-[var(--muted)] rounded-tl" />
                <div className="absolute top-4 right-4 w-5 h-5 border-t-2 border-r-2 border-[var(--muted)] rounded-tr" />
                <div className="absolute bottom-4 left-4 w-5 h-5 border-b-2 border-l-2 border-[var(--muted)] rounded-bl" />
                <div className="absolute bottom-4 right-4 w-5 h-5 border-b-2 border-r-2 border-[var(--muted)] rounded-br" />

                <div className="w-12 h-12 rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[var(--accent)] mb-3 shadow-sm">
                  <Camera size={24} weight="bold" />
                </div>

                <h3 className="text-sm font-semibold text-[var(--foreground)] mb-1">
                  Position Document Within Frame
                </h3>
                <p className="text-xs text-[var(--muted)] max-w-xs leading-relaxed">
                  Hold camera steady over receipt, invoice, or physical document with good lighting.
                </p>

                <div className="mt-3 text-[10.5px] font-mono text-[var(--muted)] bg-[var(--surface)] px-2.5 py-1 rounded-full border border-[var(--border)]">
                  Target: {targetSheetTitle}
                </div>
              </div>

              {/* Action Buttons: Camera & Upload */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[var(--foreground)] text-[var(--background)] text-xs font-semibold hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer shadow-sm"
                >
                  <Camera size={16} weight="bold" />
                  <span>Open Camera</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[var(--surface-muted)] hover:bg-[var(--border)] border border-[var(--border)] text-[var(--foreground)] text-xs font-medium active:scale-[0.98] transition-all cursor-pointer"
                >
                  <FolderOpen size={16} />
                  <span>Upload Image</span>
                </button>
              </div>
            </div>
          )}

          {/* STAGE 2: PREVIEW */}
          {stage === "preview" && previewUrl && (
            <div className="space-y-4">
              <div className="relative rounded-2xl bg-black/50 border border-[var(--border)] p-2 flex flex-col items-center justify-center overflow-hidden">
                <img
                  src={previewUrl}
                  alt="Document preview"
                  className="max-h-72 w-auto object-contain rounded-xl shadow-lg"
                />

                {imageMeta && (
                  <div className="absolute bottom-4 left-4 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md text-[10px] font-mono text-white/90 border border-white/10">
                    {imageMeta.width} × {imageMeta.height} · {imageMeta.sizeKb} KB
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex-1 py-2.5 rounded-xl bg-[var(--surface-muted)] hover:bg-[var(--border)] border border-[var(--border)] text-xs font-medium text-[var(--foreground)] transition-colors cursor-pointer"
                >
                  Retake Photo
                </button>

                <button
                  type="button"
                  onClick={handleRunExtraction}
                  className="flex-2 py-2.5 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-semibold shadow-sm transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>Extract Data</span>
                  <Sparkle size={14} weight="fill" />
                </button>
              </div>
            </div>
          )}

          {/* STAGE 3: EXTRACTING PROGRESS */}
          {stage === "extracting" && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative flex items-center justify-center">
                <div className="w-14 h-14 rounded-full border-2 border-[var(--accent)]/20 border-t-[var(--accent)] animate-spin" />
                <div className="absolute w-8 h-8 rounded-full bg-[var(--surface-muted)] flex items-center justify-center text-[var(--accent)]">
                  <Sparkle size={16} weight="fill" className="animate-pulse" />
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-[var(--foreground)]">
                  Analyzing Document
                </h3>
                <p className="text-xs text-[var(--muted)] font-mono animate-pulse">
                  {extractionProgressText}
                </p>
              </div>

              <div className="text-[11px] font-mono text-[var(--muted)] bg-[var(--surface-inner)] px-3 py-1 rounded-full border border-[var(--border)]">
                Schema: {targetSheetTitle}
              </div>
            </div>
          )}

          {/* STAGE 4: REVIEW */}
          {stage === "review" && extractionResult && previewUrl && (
            <ExtractionReview
              imagePreviewUrl={previewUrl}
              extractionResult={extractionResult}
              onScanAnother={handleReset}
              onRetryExtraction={handleRunExtraction}
            />
          )}

          {/* STAGE 5: ERROR */}
          {stage === "error" && (
            <div className="py-8 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mx-auto">
                <WarningCircle size={24} weight="bold" />
              </div>

              <div className="space-y-1 max-w-sm mx-auto">
                <h3 className="text-sm font-semibold text-[var(--foreground)]">
                  Extraction Failed
                </h3>
                <p className="text-xs text-rose-600 dark:text-rose-400">
                  {errorMessage || "Unable to extract information from this document image."}
                </p>
              </div>

              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2.5 rounded-xl bg-[var(--surface-muted)] hover:bg-[var(--border)] border border-[var(--border)] text-xs font-medium text-[var(--foreground)] transition-colors cursor-pointer"
                >
                  Choose Different Photo
                </button>

                {selectedFile && (
                  <button
                    type="button"
                    onClick={handleRunExtraction}
                    className="px-4 py-2.5 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-semibold transition-all active:scale-[0.98] cursor-pointer flex items-center gap-1.5"
                  >
                    <ArrowsClockwise size={14} />
                    <span>Try Again</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
