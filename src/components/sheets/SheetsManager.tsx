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
        )}&sheetTitle=${encodeURIComponent(sheetTitle)}&limit=100`
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
      <div className="max-w-lg mx-auto space-y-6 pt-4 text-left">
        <DoubleBezelCard glow className="border-dashed">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-surface-muted border border-border flex items-center justify-center text-accent">
                <Table size={16} />
              </div>
              <h1 className="text-sm font-semibold text-foreground font-sans">
                Spreadsheet Hub
              </h1>
            </div>
            <span className="text-[10px] font-mono text-muted bg-surface-muted px-2 py-0.5 rounded-full border border-border">
              Connect
            </span>
          </div>

          <p className="text-xs text-muted leading-relaxed mb-4">
            No active spreadsheet connected. Create a new Google Spreadsheet or connect an existing one.
          </p>

          <div className="space-y-2.5">
            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl bg-foreground text-background hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer shadow-sm"
            >
              <div className="flex items-center gap-3 text-left">
                <div className="w-8 h-8 rounded-xl bg-background/15 flex items-center justify-center text-background shrink-0">
                  <FilePlus size={18} weight="bold" />
                </div>
                <div>
                  <div className="text-xs font-semibold">Create New Spreadsheet</div>
                  <div className="text-[11px] opacity-75">Define custom columns & create in Drive</div>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setIsConnectOpen(true)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-surface-muted hover:bg-border border border-border text-foreground transition-all active:scale-[0.98] cursor-pointer"
            >
              <div className="flex items-center gap-3 text-left">
                <div className="w-8 h-8 rounded-xl bg-surface border border-border flex items-center justify-center text-muted shrink-0">
                  <FolderOpen size={17} />
                </div>
                <div>
                  <div className="text-xs font-medium">Connect Existing Spreadsheet</div>
                  <div className="text-[11px] text-muted">Google Picker or paste URL</div>
                </div>
              </div>
            </button>
          </div>
        </DoubleBezelCard>

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
    <div className="space-y-5 text-left animate-in fade-in duration-200">
      {/* Top Banner: Spreadsheet Identity & Primary Controls */}
      <DoubleBezelCard glow className="bg-gradient-to-b from-surface to-surface-muted/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-accent" />
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
                className="text-accent hover:underline flex items-center gap-1 inline-flex"
              >
                <span>Google Sheets</span>
                <ArrowSquareOut size={12} />
              </a>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/scan"
              className="px-3 py-1.5 rounded-xl bg-foreground text-background text-xs font-semibold hover:opacity-90 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Camera size={14} weight="bold" className="text-accent" />
              <span>Scan</span>
            </Link>

            <Link
              href="/analysis"
              className="px-3 py-1.5 rounded-xl bg-surface hover:bg-border border border-border text-foreground text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <ChartBar size={14} className="text-accent" />
              <span>Analyze</span>
            </Link>

            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="px-2.5 py-1.5 rounded-xl bg-surface-muted hover:bg-border border border-border text-muted hover:text-foreground text-xs font-mono transition-colors cursor-pointer"
              title="Create another sheet"
            >
              <FilePlus size={14} />
            </button>

            <button
              type="button"
              onClick={() => setIsConnectOpen(true)}
              className="px-2.5 py-1.5 rounded-xl bg-surface-muted hover:bg-border border border-border text-muted hover:text-foreground text-xs font-mono transition-colors cursor-pointer"
              title="Switch spreadsheet"
            >
              <FolderOpen size={14} />
            </button>

            <button
              type="button"
              onClick={() =>
                loadData(connectedSheet.spreadsheetId, connectedSheet.sheetTitle)
              }
              disabled={isLoading}
              className="p-1.5 rounded-xl bg-surface-muted hover:bg-border border border-border text-muted hover:text-foreground transition-colors cursor-pointer"
              title="Refresh spreadsheet data"
            >
              <ArrowsClockwise
                size={14}
                className={isLoading ? "animate-spin text-accent" : ""}
              />
            </button>
          </div>
        </div>

        {/* View Switcher: Table View vs Schema Inspector */}
        <div className="flex items-center gap-1 pt-3">
          <button
            type="button"
            onClick={() => setActiveTab("table")}
            className={`px-3 py-1 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
              activeTab === "table"
                ? "bg-surface text-foreground font-semibold border border-border shadow-xs"
                : "text-muted hover:text-foreground"
            }`}
          >
            Live Data Table ({rowsCount})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("schema")}
            className={`px-3 py-1 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
              activeTab === "schema"
                ? "bg-surface text-foreground font-semibold border border-border shadow-xs"
                : "text-muted hover:text-foreground"
            }`}
          >
            Schema & Columns ({colsCount})
          </button>
        </div>
      </DoubleBezelCard>

      {/* Main Viewport */}
      {isLoading ? (
        <div className="py-16 flex flex-col items-center justify-center text-center space-y-3 bg-surface rounded-3xl border border-border">
          <LdrsLoader variant="hourglass" size={32} label="Loading Google Sheets data" />
          <div className="text-xs font-mono text-muted">
            Reading rows from Google Sheets API v4...
          </div>
        </div>
      ) : activeTab === "table" ? (
        /* Real Data Table View */
        <DoubleBezelCard className="overflow-hidden p-0">
          {!sheetData || sheetData.rows.length === 0 ? (
            <div className="p-8 text-center text-xs font-mono text-muted">
              No data rows found in {connectedSheet.sheetTitle}. Photograph a document using{" "}
              <Link href="/scan" className="text-accent underline font-semibold">
                [Scan]
              </Link>{" "}
              to append your first records.
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[60vh] scrollbar-thin">
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
                      <td className="py-2 px-3.5 text-muted text-center text-[10.5px] border-r border-border/40 font-bold">
                        {rowIdx + 1}
                      </td>
                      {sheetData.headers.map((header, colIdx) => (
                        <td
                          key={colIdx}
                          className="py-2 px-3.5 text-foreground whitespace-nowrap max-w-[240px] truncate font-medium"
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
        </DoubleBezelCard>
      ) : (
        /* Schema & Column Inspector */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {sheetData?.columnAnalysis.map((col, idx) => (
            <DoubleBezelCard key={idx} className="space-y-2">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="w-5 h-5 rounded-md bg-surface-muted border border-border text-[10px] font-mono font-bold text-muted flex items-center justify-center shrink-0">
                    {col.letter}
                  </span>
                  <span className="text-xs font-semibold text-foreground truncate">
                    {col.name}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[10px] font-mono text-muted bg-surface-inner px-1.5 py-0.5 rounded border border-border">
                  <ColumnTypeIcon type={col.type} />
                  <span className="capitalize">{col.type}</span>
                </div>
              </div>

              <div className="space-y-1 text-[11px] font-mono text-muted">
                <div className="flex justify-between">
                  <span>Populated</span>
                  <span className="text-foreground">{col.nonEmptyCount} / {rowsCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Unique Values</span>
                  <span className="text-foreground">{col.uniqueValues}</span>
                </div>
                {col.stats?.sum !== undefined && (
                  <div className="flex justify-between pt-1 border-t border-border-subtle text-accent font-semibold">
                    <span>Sum</span>
                    <span>{col.stats.sum.toLocaleString()}</span>
                  </div>
                )}
                {col.stats?.avg !== undefined && (
                  <div className="flex justify-between">
                    <span>Avg</span>
                    <span>{col.stats.avg.toFixed(1)}</span>
                  </div>
                )}
              </div>
            </DoubleBezelCard>
          ))}
        </div>
      )}

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
