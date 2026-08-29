"use client";

import React, { useState } from "react";
import {
  Table,
  Plus,
  Trash,
  X,
  ArrowUp,
  ArrowDown,
  CircleNotch,
  CheckCircle,
  WarningCircle,
  Sparkle,
  FilePlus,
} from "@phosphor-icons/react";
import { ConnectedSpreadsheet, indexToColumnLetter } from "@/lib/sheets/types";

interface CreateSpreadsheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (connected: ConnectedSpreadsheet) => void;
}

// Minimal starter presets that simply populate the column builder
const STARTER_PRESETS: Array<{ label: string; name: string; sheet: string; columns: string[] }> = [
  {
    label: "Receipts",
    name: "Receipt Records",
    sheet: "Receipts",
    columns: ["Date", "Vendor", "Total Amount", "Payment Method", "Category"],
  },
  {
    label: "Invoices",
    name: "Client Invoices",
    sheet: "Invoices",
    columns: ["Invoice No", "Date", "Client", "Description", "Amount", "Status"],
  },
  {
    label: "Inventory / Items",
    name: "Stock Inventory",
    sheet: "Items",
    columns: ["SKU", "Item Name", "Quantity", "Unit Price", "Supplier"],
  },
];

export function CreateSpreadsheetModal({
  isOpen,
  onClose,
  onCreated,
}: CreateSpreadsheetModalProps) {
  const [spreadsheetName, setSpreadsheetName] = useState("Purchase Records");
  const [sheetName, setSheetName] = useState("Sheet1");
  const [columns, setColumns] = useState<string[]>([
    "Date",
    "Vendor",
    "Product",
    "Quantity",
    "Total",
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progressText, setProgressText] = useState("Creating spreadsheet...");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Real-time validation checks
  const validateSchema = (): { isValid: boolean; error: string | null } => {
    if (!spreadsheetName.trim()) {
      return { isValid: false, error: "Please enter a spreadsheet name." };
    }

    if (columns.length === 0) {
      return { isValid: false, error: "Please add at least one column." };
    }

    const seen = new Set<string>();
    for (let i = 0; i < columns.length; i++) {
      const col = columns[i].trim();
      if (!col) {
        return { isValid: false, error: `Column ${indexToColumnLetter(i)} is empty.` };
      }
      const lower = col.toLowerCase();
      if (seen.has(lower)) {
        return {
          isValid: false,
          error: `Duplicate column "${col}" at Column ${indexToColumnLetter(i)}. Names must be unique.`,
        };
      }
      seen.add(lower);
    }

    return { isValid: true, error: null };
  };

  const validation = validateSchema();

  // Column CRUD
  const handleAddColumn = () => {
    if (columns.length >= 40) return;
    setColumns((prev) => [...prev, ""]);
  };

  const handleUpdateColumn = (index: number, value: string) => {
    setColumns((prev) => {
      const copy = [...prev];
      copy[index] = value;
      return copy;
    });
  };

  const handleRemoveColumn = (index: number) => {
    if (columns.length <= 1) return;
    setColumns((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleMoveColumn = (index: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= columns.length) return;

    setColumns((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIdx];
      copy[targetIdx] = temp;
      return copy;
    });
  };

  // Apply Preset
  const handleApplyPreset = (preset: (typeof STARTER_PRESETS)[0]) => {
    setSpreadsheetName(preset.name);
    setSheetName(preset.sheet);
    setColumns([...preset.columns]);
    setErrorMessage(null);
  };

  // Handle Submission to Server API
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validation.isValid || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);
    setProgressText("Creating Google Spreadsheet...");

    try {
      const timer = setTimeout(() => {
        setProgressText("Setting up column headers in Row 1...");
      }, 900);

      const res = await fetch("/api/sheets/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          spreadsheetName: spreadsheetName.trim(),
          sheetName: sheetName.trim() || "Sheet1",
          columns: columns.map((c) => c.trim()),
        }),
      });

      clearTimeout(timer);

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to create spreadsheet.");
      }

      onCreated(json.data);
      onClose();
    } catch (err: unknown) {
      console.error("Spreadsheet creation error:", err);
      const msg =
        err instanceof Error ? err.message : "Couldn't create the spreadsheet. Please try again.";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-sheet-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[var(--surface-muted)] border border-[var(--border)] flex items-center justify-center text-[var(--accent)]">
              <FilePlus size={16} weight="bold" />
            </div>
            <h2 id="create-sheet-modal-title" className="text-sm font-semibold text-[var(--foreground)]">
              Create New Spreadsheet
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            disabled={isSubmitting}
            className="p-1.5 rounded-full text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-muted)] transition-colors cursor-pointer disabled:opacity-40"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-4 text-left">
          {/* Error Banner */}
          {errorMessage && (
            <div
              role="alert"
              className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-300 text-xs flex items-start gap-2"
            >
              <WarningCircle size={15} className="text-rose-500 shrink-0 mt-0.5" />
              <span className="leading-snug">{errorMessage}</span>
            </div>
          )}

          {/* Quick Starter Presets Bar */}
          <div className="space-y-1.5">
            <div className="text-[10.5px] font-mono text-[var(--muted)] uppercase tracking-wider">
              Quick Starter Schema
            </div>
            <div className="flex flex-wrap gap-1.5">
              {STARTER_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  disabled={isSubmitting}
                  className="px-2.5 py-1 rounded-lg bg-[var(--surface-muted)] hover:bg-[var(--border)] border border-[var(--border)] text-[11px] font-mono text-[var(--foreground)] transition-colors cursor-pointer"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Spreadsheet & Sheet Name Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor="spreadsheet-title-input" className="text-xs font-medium text-[var(--foreground)]">
                Spreadsheet Name
              </label>
              <input
                id="spreadsheet-title-input"
                type="text"
                value={spreadsheetName}
                onChange={(e) => setSpreadsheetName(e.target.value)}
                placeholder="e.g. Purchase Records"
                required
                disabled={isSubmitting}
                className="w-full px-3 py-2 rounded-xl bg-[var(--surface-inner)] border border-[var(--border)] text-xs text-[var(--foreground)] placeholder:text-[var(--muted)] font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)]"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="sheet-tab-input" className="text-xs font-medium text-[var(--foreground)]">
                Worksheet Tab Name
              </label>
              <input
                id="sheet-tab-input"
                type="text"
                value={sheetName}
                onChange={(e) => setSheetName(e.target.value)}
                placeholder="e.g. Sheet1 or Records"
                disabled={isSubmitting}
                className="w-full px-3 py-2 rounded-xl bg-[var(--surface-inner)] border border-[var(--border)] text-xs text-[var(--foreground)] placeholder:text-[var(--muted)] font-mono focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)]"
              />
            </div>
          </div>

          {/* Dynamic Column Schema Builder */}
          <div className="space-y-2 pt-2 border-t border-[var(--border)]">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-semibold text-[var(--foreground)]">
                  Spreadsheet Columns ({columns.length})
                </label>
                <p className="text-[11px] text-[var(--muted)]">
                  Define what information SheetLens will extract into Row 1.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddColumn}
                disabled={isSubmitting || columns.length >= 40}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[var(--surface-muted)] hover:bg-[var(--border)] border border-[var(--border)] text-[11px] font-mono text-[var(--foreground)] transition-colors cursor-pointer disabled:opacity-40"
              >
                <Plus size={12} weight="bold" />
                <span>Add Column</span>
              </button>
            </div>

            {/* Column Inputs List */}
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {columns.map((col, idx) => {
                const colLetter = indexToColumnLetter(idx);
                const isDuplicate =
                  columns.filter((c, i) => i !== idx && c.trim().toLowerCase() === col.trim().toLowerCase())
                    .length > 0 && col.trim() !== "";
                const isEmpty = !col.trim();

                return (
                  <div
                    key={idx}
                    className={`flex items-center gap-2 p-1.5 rounded-xl border transition-colors ${
                      isDuplicate || isEmpty
                        ? "bg-amber-500/5 border-amber-500/20"
                        : "bg-[var(--surface-inner)] border-[var(--border)]"
                    }`}
                  >
                    {/* Monospace Column Letter Badge */}
                    <span className="w-6 h-6 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[10px] font-mono font-bold text-[var(--muted)] flex items-center justify-center shrink-0">
                      {colLetter}
                    </span>

                    {/* Column Name Input */}
                    <input
                      type="text"
                      value={col}
                      onChange={(e) => handleUpdateColumn(idx, e.target.value)}
                      placeholder={`Column ${colLetter} name...`}
                      disabled={isSubmitting}
                      className="flex-1 px-2 py-1 rounded-lg bg-[var(--surface)] text-xs font-mono text-[var(--foreground)] placeholder:text-[var(--muted)] border border-transparent focus-visible:border-[var(--accent)] focus-visible:outline-none"
                    />

                    {/* Reorder Buttons: Move Up / Down */}
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleMoveColumn(idx, "up")}
                        disabled={idx === 0 || isSubmitting}
                        aria-label={`Move column ${colLetter} up`}
                        className="p-1 rounded-md text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface)] disabled:opacity-20 transition-colors cursor-pointer"
                      >
                        <ArrowUp size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveColumn(idx, "down")}
                        disabled={idx === columns.length - 1 || isSubmitting}
                        aria-label={`Move column ${colLetter} down`}
                        className="p-1 rounded-md text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface)] disabled:opacity-20 transition-colors cursor-pointer"
                      >
                        <ArrowDown size={12} />
                      </button>
                    </div>

                    {/* Delete Column Button */}
                    <button
                      type="button"
                      onClick={() => handleRemoveColumn(idx)}
                      disabled={columns.length <= 1 || isSubmitting}
                      aria-label={`Remove column ${colLetter}`}
                      className="p-1 rounded-md text-[var(--muted)] hover:text-rose-500 hover:bg-rose-500/10 disabled:opacity-20 transition-colors cursor-pointer shrink-0"
                    >
                      <Trash size={13} />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Validation Warning Indicator */}
            {!validation.isValid && validation.error && (
              <div className="text-[11px] font-mono text-amber-600 dark:text-amber-300 flex items-center gap-1.5 pt-1">
                <WarningCircle size={13} weight="bold" />
                <span>{validation.error}</span>
              </div>
            )}
          </div>

          {/* Submission Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={!validation.isValid || isSubmitting}
              className="w-full py-3 px-4 rounded-xl bg-[var(--foreground)] text-[var(--background)] text-xs font-semibold hover:opacity-90 active:scale-[0.98] disabled:opacity-40 transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm"
            >
              {isSubmitting ? (
                <>
                  <CircleNotch size={15} className="animate-spin text-[var(--accent)]" />
                  <span className="font-mono">{progressText}</span>
                </>
              ) : (
                <>
                  <FilePlus size={15} weight="bold" />
                  <span>Create & Start Scanning</span>
                  <CheckCircle size={15} weight="bold" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
