"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Table,
  Camera,
  ChartBar,
  FilePlus,
  FolderOpen,
  ArrowRight,
  ArrowSquareOut,
  ArrowsClockwise,
  Sparkle,
  Hash,
  Calendar,
  Tag,
  TextT,
  CheckCircle,
} from "@phosphor-icons/react";
import { ConnectedSpreadsheet, SheetDataPayload, InferredColumnType } from "@/lib/sheets/types";
import { DoubleBezelCard } from "@/components/ui/DoubleBezelCard";
import { CreateSpreadsheetModal } from "@/components/sheets/CreateSpreadsheetModal";
import { SpreadsheetConnectorModal } from "@/components/sheets/SpreadsheetConnectorModal";
import { LdrsLoader } from "@/components/ui/LdrsLoader";

interface HomeInstrumentProps {
  initialConnectedSheet: ConnectedSpreadsheet | null;
}

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

export function HomeInstrument({ initialConnectedSheet }: HomeInstrumentProps) {
  const [connectedSheet, setConnectedSheet] = useState<ConnectedSpreadsheet | null>(
    initialConnectedSheet
  );
  const [sheetData, setSheetData] = useState<SheetDataPayload | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isConnectOpen, setIsConnectOpen] = useState(false);

  // Fetch real Google Sheets data when a spreadsheet is connected
  const loadSheetData = async (spreadsheetId: string, sheetTitle: string) => {
    setIsLoadingData(true);
    try {
      const res = await fetch(
        `/api/sheets/data?spreadsheetId=${encodeURIComponent(
          spreadsheetId
        )}&sheetTitle=${encodeURIComponent(sheetTitle)}&limit=10`
      );
      const json = await res.json();
      if (res.ok && json.success) {
        setSheetData(json.data);
      }
    } catch (err) {
      console.error("Failed to load home sheet data:", err);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    if (connectedSheet?.spreadsheetId && connectedSheet?.sheetTitle) {
      loadSheetData(connectedSheet.spreadsheetId, connectedSheet.sheetTitle);
    }
  }, [connectedSheet?.spreadsheetId, connectedSheet?.sheetTitle]);

  // When no spreadsheet is connected: Show Setup Instrument with responsive 2-column desktop grid
  if (!connectedSheet) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 pt-4 text-left animate-in fade-in duration-200">
        <div className="text-center sm:text-left mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-muted border border-border text-xs font-mono text-muted mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span>Workspace Setup</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-sans">
            Connect Your Target Google Spreadsheet
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-1 max-w-xl">
            Choose where your captured physical receipts and document data will be recorded.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Primary Choice: Create New Spreadsheet */}
          <DoubleBezelCard glow className="h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl bg-foreground text-background flex items-center justify-center">
                  <FilePlus size={20} weight="bold" />
                </div>
                <span className="text-[10px] font-mono uppercase text-accent bg-accent-subtle px-2 py-0.5 rounded-full border border-accent-border font-bold">
                  Recommended
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-semibold text-foreground font-sans mb-1.5">
                Create New Spreadsheet
              </h2>
              <p className="text-xs text-muted leading-relaxed mb-6">
                Start from scratch with custom column headers. SheetLens creates and formats a clean sheet directly in your Google Drive.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-foreground text-background text-xs font-semibold hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer shadow-sm group"
            >
              <span>Create Spreadsheet</span>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </DoubleBezelCard>

          {/* Secondary Choice: Connect Existing Spreadsheet */}
          <DoubleBezelCard className="h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl bg-surface-muted border border-border text-muted flex items-center justify-center">
                  <FolderOpen size={20} />
                </div>
                <span className="text-[10px] font-mono text-muted bg-surface-inner px-2 py-0.5 rounded-full border border-border">
                  Existing
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-semibold text-foreground font-sans mb-1.5">
                Connect Existing Sheet
              </h2>
              <p className="text-xs text-muted leading-relaxed mb-6">
                Select an existing Google Sheet using Google Drive Picker or paste a direct link. Header row 1 is automatically analyzed.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsConnectOpen(true)}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-surface-muted hover:bg-border border border-border text-foreground text-xs font-semibold active:scale-[0.98] transition-all cursor-pointer group"
            >
              <span>Connect Existing</span>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform text-muted" />
            </button>
          </DoubleBezelCard>
        </div>

        {/* Modals */}
        <CreateSpreadsheetModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          onCreated={(sheet) => setConnectedSheet(sheet)}
        />
        <SpreadsheetConnectorModal
          isOpen={isConnectOpen}
          onClose={() => setIsConnectOpen(false)}
          onConnected={(sheet) => setConnectedSheet(sheet)}
        />
      </div>
    );
  }

  // Connected State: Desktop Asymmetric Responsive Layout
  const totalRows = sheetData ? sheetData.totalRows : 0;
  const columnsCount = connectedSheet.headers.length;

  return (
    <div className="space-y-6 text-left animate-in fade-in duration-200">
      {/* DESKTOP ASYMMETRIC GRID (12 COLS: 4 COLS LEFT / 8 COLS RIGHT) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN (lg:col-span-4): Workspace Context & Actions */}
        <div className="lg:col-span-4 space-y-5">
          {/* Main Context Card */}
          <DoubleBezelCard glow className="bg-gradient-to-b from-surface to-surface-muted/50">
            {/* Header: Title & Google Drive Link */}
            <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
              <div className="min-w-0 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-accent animate-pulse shrink-0" />
                <h1 className="text-xs font-mono font-bold uppercase tracking-wider text-foreground truncate">
                  {connectedSheet.spreadsheetTitle}
                </h1>
              </div>

              <a
                href={connectedSheet.spreadsheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Open in Google Sheets"
                className="p-1.5 rounded-lg bg-surface hover:bg-border border border-border text-muted hover:text-foreground transition-colors shrink-0"
              >
                <ArrowSquareOut size={14} />
              </a>
            </div>

            {/* Live Metrics: Rows & Active Tab */}
            <div className="flex items-baseline justify-between gap-4 mb-4">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl font-bold font-mono tracking-tight text-foreground">
                    {isLoadingData ? "..." : totalRows.toLocaleString()}
                  </span>
                  <span className="text-xs font-mono text-muted uppercase">
                    rows
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] font-mono text-muted mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Tab: {connectedSheet.sheetTitle}</span>
                </div>
              </div>

              {/* Mini Sparkline / Density Strip */}
              <div className="flex items-end gap-1 h-8 px-2.5 py-1 rounded-lg bg-surface-inner border border-border">
                {[40, 65, 30, 85, 45, 90, 75, 100].map((h, i) => (
                  <div
                    key={i}
                    style={{ height: `${h}%` }}
                    className={`w-1 rounded-full ${
                      i >= 5 ? "bg-accent" : "bg-muted/40"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Target Schema Columns Preview */}
            <div className="border-t border-border pt-3 mb-4 space-y-2">
              <div className="flex items-center justify-between text-[10.5px] font-mono text-muted">
                <span>TARGET COLUMNS ({columnsCount})</span>
                <span className="text-accent font-semibold">Row 1 Schema</span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {connectedSheet.headers.map((h, i) => {
                  const inferred = sheetData?.columnAnalysis.find((c) => c.name === h.name)?.type || "text";
                  return (
                    <div
                      key={i}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-surface-inner border border-border text-[10.5px] font-mono text-foreground"
                    >
                      <ColumnTypeIcon type={inferred} />
                      <span className="truncate max-w-[110px]">{h.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Primary Action Buttons: Scan & Analyze */}
            <div className="space-y-2 pt-1">
              <Link
                href="/scan"
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-foreground text-background text-xs font-semibold hover:opacity-90 active:scale-[0.98] shadow-sm transition-all text-center group"
              >
                <Camera size={16} weight="bold" className="text-accent group-hover:scale-110 transition-transform" />
                <span>Scan Document</span>
                <Sparkle size={13} weight="fill" className="text-accent" />
              </Link>

              <Link
                href="/analysis"
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-surface hover:bg-border border border-border text-foreground text-xs font-semibold active:scale-[0.98] transition-all text-center"
              >
                <ChartBar size={15} className="text-accent" />
                <span>Visual Analysis</span>
              </Link>
            </div>

            {/* Secondary Controls (Switch / Create) */}
            <div className="flex items-center justify-between pt-3 mt-3 border-t border-border-subtle text-[11px] font-mono text-muted">
              <button
                type="button"
                onClick={() => setIsConnectOpen(true)}
                className="hover:text-foreground transition-colors flex items-center gap-1 cursor-pointer"
              >
                <FolderOpen size={13} />
                <span>Switch Sheet</span>
              </button>

              <button
                type="button"
                onClick={() => setIsCreateOpen(true)}
                className="hover:text-foreground transition-colors flex items-center gap-1 cursor-pointer"
              >
                <FilePlus size={13} />
                <span>Create New</span>
              </button>
            </div>
          </DoubleBezelCard>
        </div>

        {/* RIGHT COLUMN (lg:col-span-8): Real Live Spreadsheet Data Table Workspace */}
        <div className="lg:col-span-8 space-y-5">
          <DoubleBezelCard className="p-0 overflow-hidden">
            {/* Table Top Controls Strip */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border bg-surface-muted/40">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-surface border border-border flex items-center justify-center text-muted">
                  <Table size={15} />
                </div>
                <div>
                  <h2 className="text-xs sm:text-sm font-semibold text-foreground font-sans">
                    Live Spreadsheet Records
                  </h2>
                  <div className="text-[11px] font-mono text-muted">
                    {connectedSheet.spreadsheetTitle} · {connectedSheet.sheetTitle}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    loadSheetData(connectedSheet.spreadsheetId, connectedSheet.sheetTitle)
                  }
                  disabled={isLoadingData}
                  title="Refresh rows"
                  className="p-1.5 rounded-lg bg-surface hover:bg-border border border-border text-muted hover:text-foreground transition-colors cursor-pointer"
                >
                  <ArrowsClockwise
                    size={14}
                    className={isLoadingData ? "animate-spin text-accent" : ""}
                  />
                </button>

                <Link
                  href="/sheets"
                  className="hidden sm:inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-surface hover:bg-border border border-border text-xs font-mono text-foreground transition-colors"
                >
                  <span>Open Full Table</span>
                  <ArrowRight size={12} />
                </Link>
              </div>
            </div>

            {/* Table Body Area */}
            {isLoadingData ? (
              <div className="py-16 flex flex-col items-center justify-center text-center space-y-2.5">
                <LdrsLoader variant="hourglass" size={30} label="Fetching rows from Google Sheets" />
                <span className="text-[11px] font-mono text-muted">
                  Syncing records from Google Sheets API v4...
                </span>
              </div>
            ) : !sheetData || sheetData.rows.length === 0 ? (
              <div className="py-12 px-6 text-center space-y-3">
                <div className="w-10 h-10 rounded-xl bg-surface-muted border border-border flex items-center justify-center text-muted mx-auto">
                  <Table size={20} />
                </div>
                <div className="text-xs font-mono text-foreground font-semibold">
                  No data rows recorded yet
                </div>
                <p className="text-xs text-muted max-w-sm mx-auto">
                  Your connected spreadsheet is ready. Capture a physical receipt or invoice using Scan to populate your first rows.
                </p>
                <Link
                  href="/scan"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-foreground text-background text-xs font-semibold hover:opacity-90 transition-all"
                >
                  <Camera size={14} weight="bold" className="text-accent" />
                  <span>Start Scanning</span>
                </Link>
              </div>
            ) : (
              <div className="p-4 sm:p-5 space-y-4">
                {/* Horizontal Scrollable Table with Column Letters A, B, C */}
                <div className="overflow-x-auto rounded-xl border border-border bg-surface">
                  <table className="w-full text-left text-xs font-mono border-collapse">
                    <thead>
                      <tr className="bg-surface-muted/70 border-b border-border text-[11px] text-muted">
                        <th className="py-2.5 px-3 font-semibold w-10 text-center border-r border-border/50">
                          #
                        </th>
                        {sheetData.headers.map((h, i) => (
                          <th
                            key={i}
                            className="py-2.5 px-3 font-semibold text-foreground whitespace-nowrap"
                          >
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-muted font-bold opacity-75">
                                {String.fromCharCode(65 + i)}
                              </span>
                              <span>{h}</span>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle bg-surface">
                      {sheetData.rows.map((row, rowIdx) => (
                        <tr
                          key={rowIdx}
                          className="hover:bg-surface-muted/30 transition-colors"
                        >
                          <td className="py-2.5 px-3 text-muted text-center text-[10.5px] border-r border-border/40 font-bold">
                            {rowIdx + 1}
                          </td>
                          {sheetData.headers.map((header, colIdx) => (
                            <td
                              key={colIdx}
                              className="py-2.5 px-3 text-foreground whitespace-nowrap max-w-[200px] truncate"
                            >
                              {row[header] !== null && row[header] !== undefined
                                ? String(row[header])
                                : <span className="text-muted/40">—</span>}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Footer Strip */}
                <div className="flex items-center justify-between text-[11px] font-mono text-muted pt-1">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle size={14} weight="fill" className="text-emerald-500" />
                    <span>Displaying recent {Math.min(10, sheetData.rows.length)} of {totalRows} records</span>
                  </div>

                  <Link
                    href="/sheets"
                    className="text-foreground hover:text-accent font-medium transition-colors flex items-center gap-1"
                  >
                    <span>View all {totalRows} records in Sheets tab</span>
                    <ArrowRight size={12} />
                  </Link>
                </div>
              </div>
            )}
          </DoubleBezelCard>
        </div>
      </div>

      {/* Modals */}
      <CreateSpreadsheetModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={(sheet) => setConnectedSheet(sheet)}
      />
      <SpreadsheetConnectorModal
        isOpen={isConnectOpen}
        onClose={() => setIsConnectOpen(false)}
        onConnected={(sheet) => setConnectedSheet(sheet)}
      />
    </div>
  );
}
