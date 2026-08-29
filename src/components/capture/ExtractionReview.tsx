"use client";

import React, { useState } from "react";
import {
  Table,
  CheckCircle,
  ArrowsClockwise,
  Plus,
  Trash,
  Image as ImageIcon,
  CaretDown,
  CaretUp,
  Sparkle,
  ArrowRight,
  ArrowLeft,
  Eye,
} from "@phosphor-icons/react";
import { ExtractionResult, ExtractedRow } from "@/lib/gemini/types";
import { DoubleBezelCard } from "@/components/ui/DoubleBezelCard";
import Image from "next/image";

interface ExtractionReviewProps {
  imagePreviewUrl: string;
  extractionResult: ExtractionResult;
  onScanAnother: () => void;
  onRetryExtraction: () => void;
}

export function ExtractionReview({
  imagePreviewUrl,
  extractionResult,
  onScanAnother,
  onRetryExtraction,
}: ExtractionReviewProps) {
  // Local editable rows state
  const [rows, setRows] = useState<Array<Record<string, string | number | null>>>(() =>
    extractionResult.rows.map((row) => {
      const flatRow: Record<string, string | number | null> = {};
      for (const col of extractionResult.columns) {
        flatRow[col] = row[col]?.value ?? null;
      }
      return flatRow;
    })
  );

  const [isImageExpanded, setIsImageExpanded] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);

  // Handle cell value edit
  const handleCellChange = (rowIndex: number, column: string, value: string) => {
    setRows((prev) => {
      const updated = [...prev];
      const targetRow = { ...updated[rowIndex] };
      
      // If user clears the input, store as empty or null
      if (value === "") {
        targetRow[column] = null;
      } else {
        // Parse number if string is strictly numeric, else store string
        const num = Number(value);
        targetRow[column] = !isNaN(num) && value.trim() !== "" ? num : value;
      }

      updated[rowIndex] = targetRow;
      return updated;
    });
  };

  // Add empty line item row
  const handleAddRow = () => {
    const newRow: Record<string, string | number | null> = {};
    for (const col of extractionResult.columns) {
      newRow[col] = null;
    }
    setRows((prev) => [...prev, newRow]);
  };

  // Remove line item row
  const handleDeleteRow = (rowIndex: number) => {
    if (rows.length <= 1) return;
    setRows((prev) => prev.filter((_, idx) => idx !== rowIndex));
  };

  return (
    <div className="w-full space-y-4">
      {/* Top Status Banner */}
      <div className="flex items-center justify-between p-3 rounded-2xl bg-surface-muted border border-border">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-surface border border-border flex items-center justify-center text-accent shrink-0">
            <CheckCircle size={15} weight="fill" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold text-foreground truncate">
              {rows.length} {rows.length === 1 ? "Record" : "Records"} Extracted
            </div>
            <div className="text-[10.5px] font-mono text-muted truncate">
              Target Tab: {extractionResult.sheetTitle}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsImageExpanded(!isImageExpanded)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-surface hover:bg-border border border-border text-[11px] font-mono text-muted hover:text-foreground transition-colors cursor-pointer shrink-0"
        >
          <Eye size={13} />
          <span>{isImageExpanded ? "Hide Image" : "View Photo"}</span>
          {isImageExpanded ? <CaretUp size={11} /> : <CaretDown size={11} />}
        </button>
      </div>

      {/* Expandable Document Photo Drawer */}
      {isImageExpanded && (
        <div className="relative rounded-2xl bg-black/40 border border-border p-2 overflow-hidden flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-200">
          <div className="relative w-full max-h-72 aspect-auto flex items-center justify-center overflow-hidden rounded-xl bg-black">
            <img
              src={imagePreviewUrl}
              alt="Captured document"
              className="max-h-72 w-auto object-contain rounded-lg shadow-md"
            />
          </div>
          <span className="text-[10px] font-mono text-muted mt-1.5">
            Original Source Document
          </span>
        </div>
      )}

      {/* Dynamic Review & Edit Section */}
      <DoubleBezelCard>
        <div className="flex items-center justify-between border-b border-border pb-3 mb-3.5">
          <div>
            <h3 className="text-xs font-semibold text-foreground">
              Review Extracted Data
            </h3>
            <p className="text-[11px] text-muted">
              Tap any field to correct or refine values before proceeding.
            </p>
          </div>

          <button
            type="button"
            onClick={handleAddRow}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-surface-muted hover:bg-border border border-border text-[11px] font-mono text-foreground transition-colors cursor-pointer"
          >
            <Plus size={12} weight="bold" />
            <span>Add Row</span>
          </button>
        </div>

        {/* Dynamic Records List */}
        <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
          {rows.map((row, rowIndex) => (
            <div
              key={rowIndex}
              className="p-3 rounded-2xl bg-surface-inner border border-border space-y-2.5 relative group"
            >
              {/* Row Header & Delete button */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted bg-surface-muted px-2 py-0.5 rounded-md border border-border">
                  Row #{rowIndex + 1}
                </span>

                {rows.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleDeleteRow(rowIndex)}
                    aria-label={`Delete row ${rowIndex + 1}`}
                    className="p-1 rounded-lg text-muted hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    title="Remove this row"
                  >
                    <Trash size={13} />
                  </button>
                )}
              </div>

              {/* Dynamic Field Inputs for this Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {extractionResult.columns.map((col) => {
                  const val = row[col];
                  const displayVal = val === null || val === undefined ? "" : String(val);
                  const isNull = val === null || val === undefined || val === "";

                  return (
                    <div key={col} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[10.5px] font-mono font-medium text-muted truncate max-w-[150px]">
                          {col}
                        </label>
                        {isNull && (
                          <span className="text-[9px] font-mono text-amber-500 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">
                            Empty
                          </span>
                        )}
                      </div>

                      <input
                        type="text"
                        value={displayVal}
                        onChange={(e) => handleCellChange(rowIndex, col, e.target.value)}
                        placeholder={`Enter ${col}...`}
                        className={`w-full px-2.5 py-1.5 rounded-xl text-xs font-mono border transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent ${
                          isNull
                            ? "bg-surface/50 border-border-subtle text-muted placeholder:text-muted/40"
                            : "bg-surface border-border text-foreground"
                        }`}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Confirmation State Notice */}
        {isConfirmed ? (
          <div className="mt-4 p-3 rounded-2xl bg-accent-subtle border border-accent-border text-accent flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle size={17} weight="fill" />
              <span className="text-xs font-semibold">
                Extraction Verified & Ready
              </span>
            </div>
            <button
              type="button"
              onClick={onScanAnother}
              className="text-[11px] font-mono underline hover:opacity-80 cursor-pointer"
            >
              Scan Next Document →
            </button>
          </div>
        ) : (
          /* Bottom Action Bar */
          <div className="mt-4 pt-3 border-t border-border flex items-center gap-2">
            <button
              type="button"
              onClick={onRetryExtraction}
              className="px-3 py-2.5 rounded-xl bg-surface-muted hover:bg-border border border-border text-xs font-medium text-foreground transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              title="Re-run AI extraction on the current photo"
            >
              <ArrowsClockwise size={14} />
              <span className="hidden xs:inline">Re-extract</span>
            </button>

            <button
              type="button"
              onClick={onScanAnother}
              className="flex-1 py-2.5 rounded-xl bg-surface-muted hover:bg-border border border-border text-xs font-medium text-foreground transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <ArrowLeft size={14} />
              <span>Scan Another</span>
            </button>

            <button
              type="button"
              onClick={() => setIsConfirmed(true)}
              className="flex-1 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-white text-xs font-semibold shadow-sm transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>Confirm Data</span>
              <CheckCircle size={14} weight="bold" />
            </button>
          </div>
        )}
      </DoubleBezelCard>
    </div>
  );
}
