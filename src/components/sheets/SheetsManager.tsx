"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Table,
  Camera,
  ChartBar,
  FilePlus,
  FolderOpen,
  ArrowSquareOut,
  ArrowsClockwise,
  Hash,
  Calendar,
  Tag,
  TextT,
  CheckCircle,
  Sparkle,
} from "@phosphor-icons/react";
import { ConnectedSpreadsheet, SheetDataPayload, InferredColumnType } from "@/lib/sheets/types";
import { DoubleBezelCard } from "@/components/ui/DoubleBezelCard";
import { CreateSpreadsheetModal } from "./CreateSpreadsheetModal";
import { SpreadsheetConnectorModal } from "./SpreadsheetConnectorModal";
import { LdrsLoader } from "@/components/ui/LdrsLoader";

interface SheetsManagerProps {
  initialConnectedSheet: ConnectedSpreadsheet | null;
}

function ColumnTypeIcon({ type }: { type: InferredColumnType }) {
  switch (type) {
    case "number":
      return <Hash size={12} className="text-emerald-500 shrink-0" />;
    case "date":
      return <Calendar size={12} className="text-sky-500 shrink-0" />;
    case "category":
      return <Tag size={12} className="text-amber-500 shrink-0" />;
    default:
      return <TextT size={12} className="text-muted shrink-0" />;
  }
}

export function SheetsManager({ initialConnectedSheet }: SheetsManagerProps) {
  const [connectedSheet, setConnectedSheet] = useState<ConnectedSpreadsheet | null>(
    initialConnectedSheet
  );
  const [sheetData, setSheetData] = useState<SheetDataPayload | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isConnectOpen, setIsConnectOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"table" | "schema">("table");

  const loadData = async (spreadsheetId: string, sheetTitle: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch(
        `/api/sheets/data?spreadsheetId=${encodeURIComponent(
          spreadsheetId
        )}&sheetTitle=${encodeURIComponent(sheetTitle)}&limit=150`
      );
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to load Google Sheets data.");
      }
      setSheetData(json.data);
    } catch (err: unknown) {
      console.error("Error loading sheets data:", err);
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to load Google Sheets data."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (connectedSheet?.spreadsheetId && connectedSheet?.sheetTitle) {
      loadData(connectedSheet.spreadsheetId, connectedSheet.sheetTitle);
    }
  }, [connectedSheet?.spreadsheetId, connectedSheet?.sheetTitle]);

  if (!connectedSheet) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 pt-4 text-left animate-in fade-in duration-200">
        <div className="text-center sm:text-left mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-muted border border-border text-xs font-mono text-muted mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            <span>Spreadsheet Hub</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-sans">
            Connect or Create Google Spreadsheet
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-1 max-w-xl">
            Choose a target spreadsheet to store and organize your physical document extractions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                Define custom column names and create a clean, dedicated Google Spreadsheet directly in your Drive.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-foreground text-background text-xs font-semibold hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer shadow-sm"
            >
              <span>Create New Spreadsheet</span>
            </button>
          </DoubleBezelCard>

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
                Connect an existing spreadsheet from your Google Drive via file picker or URL. SheetLens reads Row 1 as headers.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsConnectOpen(true)}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-surface-muted hover:bg-border border border-border text-foreground text-xs font-semibold active:scale-[0.98] transition-all cursor-pointer"
            >
              <span>Connect Existing Sheet</span>
            </button>
          </DoubleBezelCard>
        </div>

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

  const rowsCount = sheetData ? sheetData.totalRows : 0;
  const colsCount = connectedSheet.headers.length;

  return (
    <div className="space-y-6 text-left animate-in fade-in duration-200">
      {/* Top Banner: Spreadsheet Identity & Primary Action Toolbar */}
      <DoubleBezelCard glow className="bg-gradient-to-b from-surface to-surface-muted/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Identity & Status */}
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse shrink-0" />
              <h1 className="text-sm sm:text-base font-bold font-mono text-foreground truncate">
                {connectedSheet.spreadsheetTitle}
              </h1>
              <span className="text-[10.5px] font-mono text-muted bg-surface-inner px-2 py-0.5 rounded border border-border shrink-0">
                {connectedSheet.sheetTitle}
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs font-mono text-muted">
              <span>{rowsCount} rows</span>
              <span>·</span>
              <span>{colsCount} columns</span>
              <span>·</span>
              <a
                href={connectedSheet.spreadsheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline inline-flex items-center gap-1"
              >
                <span>Open in Google Sheets</span>
                <ArrowSquareOut size={12} />
              </a>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/scan"
              className="px-3.5 py-2 rounded-xl bg-foreground text-background text-xs font-semibold hover:opacity-90 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Camera size={15} weight="bold" className="text-accent" />
              <span>Scan Document</span>
              <Sparkle size={13} weight="fill" className="text-accent" />
            </Link>

            <Link
              href="/analysis"
              className="px-3.5 py-2 rounded-xl bg-surface hover:bg-border border border-border text-foreground text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <ChartBar size={15} className="text-accent" />
              <span>Analyze</span>
            </Link>

            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="px-3 py-2 rounded-xl bg-surface-muted hover:bg-border border border-border text-foreground text-xs font-mono transition-colors cursor-pointer flex items-center gap-1"
              title="Create another sheet"
            >
              <FilePlus size={14} />
              <span className="hidden sm:inline">New Sheet</span>
            </button>

            <button
              type="button"
              onClick={() => setIsConnectOpen(true)}
              className="px-3 py-2 rounded-xl bg-surface-muted hover:bg-border border border-border text-foreground text-xs font-mono transition-colors cursor-pointer flex items-center gap-1"
              title="Switch spreadsheet"
            >
              <FolderOpen size={14} />
              <span className="hidden sm:inline">Switch</span>
            </button>

            <button
              type="button"
              onClick={() =>
                loadData(connectedSheet.spreadsheetId, connectedSheet.sheetTitle)
              }
              disabled={isLoading}
              className="p-2 rounded-xl bg-surface-muted hover:bg-border border border-border text-muted hover:text-foreground transition-colors cursor-pointer"
              title="Refresh spreadsheet data"
            >
              <ArrowsClockwise
                size={15}
                className={isLoading ? "animate-spin text-accent" : ""}
              />
            </button>
          </div>
        </div>
      </DoubleBezelCard>

      {/* DESKTOP SPLIT WORKSPACE: 8 COLS (MAIN TABLE) / 4 COLS (SCHEMA & METADATA) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* MAIN SPREADSHEET PREVIEW TABLE (lg:col-span-8) */}
        <div className="lg:col-span-8 space-y-4">
          <DoubleBezelCard className="p-0 overflow-hidden">
            {/* View Switcher Header Strip */}
            <div className="flex items-center justify-between p-3.5 sm:p-4 border-b border-border bg-surface-muted/40">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("table")}
                  className={`px-3 py-1 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                    activeTab === "table"
                      ? "bg-surface text-foreground font-semibold border border-border shadow-2xs"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  Live Spreadsheet Table ({rowsCount})
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("schema")}
                  className={`lg:hidden px-3 py-1 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                    activeTab === "schema"
                      ? "bg-surface text-foreground font-semibold border border-border shadow-2xs"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  Columns ({colsCount})
                </button>
              </div>

              <div className="text-[11px] font-mono text-muted hidden sm:inline">
                Google Sheets v4 API Preview
              </div>
            </div>

            {/* Table or Loading Body */}
            {isLoading ? (
              <div className="py-20 flex flex-col items-center justify-center text-center space-y-3 bg-surface">
                <LdrsLoader variant="hourglass" size={32} label="Loading Google Sheets data" />
                <div className="text-xs font-mono text-muted">
                  Reading rows from Google Sheets API v4...
                </div>
              </div>
            ) : activeTab === "table" || window.innerWidth >= 1024 ? (
              <div>
                {!sheetData || sheetData.rows.length === 0 ? (
                  <div className="p-10 text-center space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-surface-muted border border-border flex items-center justify-center text-muted mx-auto">
                      <Table size={20} />
                    </div>
                    <div className="text-xs font-mono text-foreground font-semibold">
                      No data rows recorded in {connectedSheet.sheetTitle} yet
                    </div>
                    <p className="text-xs text-muted max-w-sm mx-auto">
                      Photograph a physical document using Scan to append your first structured records.
                    </p>
                    <Link
                      href="/scan"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-foreground text-background text-xs font-semibold hover:opacity-90 transition-all"
                    >
                      <Camera size={14} weight="bold" className="text-accent" />
                      <span>Scan Document Now</span>
                    </Link>
                  </div>
                ) : (
                  <div className="overflow-x-auto max-h-[64vh] scrollbar-thin">
                    <table className="w-full text-left text-xs font-mono border-collapse">
                      <thead className="sticky top-0 bg-surface-muted border-b border-border z-10">
                        <tr className="text-[11px] text-muted">
                          <th className="py-2.5 px-3.5 font-bold w-12 text-center border-r border-border/50">
                            #
                          </th>
                          {sheetData.headers.map((h, i) => (
                            <th
                              key={i}
                              className="py-2.5 px-3.5 font-semibold text-foreground whitespace-nowrap"
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
                            className="hover:bg-surface-muted/40 transition-colors"
                          >
                            <td className="py-2.5 px-3.5 text-muted text-center text-[10.5px] border-r border-border/40 font-bold">
                              {rowIdx + 1}
                            </td>
                            {sheetData.headers.map((header, colIdx) => (
                              <td
                                key={colIdx}
                                className="py-2.5 px-3.5 text-foreground whitespace-nowrap max-w-[240px] truncate font-medium"
                              >
                                {row[header] !== null && row[header] !== undefined
                                  ? String(row[header])
                                  : <span className="text-muted/40 font-normal">—</span>}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Table Footer Summary */}
                {sheetData && sheetData.rows.length > 0 && (
                  <div className="p-3 border-t border-border bg-surface-inner flex items-center justify-between text-[11px] font-mono text-muted">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle size={13} weight="fill" className="text-emerald-500" />
                      <span>Showing {sheetData.rows.length} rows</span>
                    </div>
                    <span>{colsCount} columns defined</span>
                  </div>
                )}
              </div>
            ) : null}
          </DoubleBezelCard>
        </div>

        {/* SIDEBAR / COLUMN SCHEMA INSPECTOR (lg:col-span-4) */}
        <div className="lg:col-span-4 space-y-4">
          <DoubleBezelCard className="space-y-3.5">
            <div className="flex items-center justify-between border-b border-border pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-surface-muted border border-border flex items-center justify-center text-muted">
                  <Hash size={13} />
                </div>
                <h2 className="text-xs font-semibold text-foreground font-sans">
                  Column Schema & Types
                </h2>
              </div>
              <span className="text-[10px] font-mono text-muted">
                {colsCount} Fields
              </span>
            </div>

            <div className="space-y-2 max-h-[58vh] overflow-y-auto pr-1">
              {sheetData?.columnAnalysis.map((col, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-surface-inner border border-border space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="w-4.5 h-4.5 rounded bg-surface-muted border border-border text-[9.5px] font-mono font-bold text-muted flex items-center justify-center shrink-0">
                        {col.letter}
                      </span>
                      <span className="text-xs font-semibold text-foreground truncate">
                        {col.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] font-mono text-muted bg-surface px-1.5 py-0.5 rounded border border-border shrink-0">
                      <ColumnTypeIcon type={col.type} />
                      <span className="capitalize">{col.type}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10.5px] font-mono text-muted pt-1 border-t border-border-subtle">
                    <span>Populated: {col.nonEmptyCount} / {rowsCount}</span>
                    {col.stats?.sum !== undefined && (
                      <span className="text-accent font-semibold">
                        Sum: {col.stats.sum.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
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
