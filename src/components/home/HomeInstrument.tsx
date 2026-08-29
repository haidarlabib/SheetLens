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
} from "@phosphor-icons/react";
import { ConnectedSpreadsheet, SheetDataPayload } from "@/lib/sheets/types";
import { DoubleBezelCard } from "@/components/ui/DoubleBezelCard";
import { CreateSpreadsheetModal } from "@/components/sheets/CreateSpreadsheetModal";
import { SpreadsheetConnectorModal } from "@/components/sheets/SpreadsheetConnectorModal";
import { LdrsLoader } from "@/components/ui/LdrsLoader";

interface HomeInstrumentProps {
  initialConnectedSheet: ConnectedSpreadsheet | null;
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

  // When no spreadsheet is connected: Show Setup Instrument
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
                Where should your data go?
              </h1>
            </div>
            <span className="text-[10px] font-mono text-muted bg-surface-muted px-2 py-0.5 rounded-full border border-border">
              Setup
            </span>
          </div>

          <p className="text-xs text-muted leading-relaxed mb-4">
            Create a new spreadsheet or connect one you already use.
          </p>

          <div className="space-y-2.5">
            {/* Primary Choice: Create New Spreadsheet */}
            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl bg-foreground text-background hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer shadow-sm group"
            >
              <div className="flex items-center gap-3 text-left min-w-0">
                <div className="w-8 h-8 rounded-xl bg-background/15 flex items-center justify-center text-background shrink-0">
                  <FilePlus size={18} weight="bold" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold flex items-center gap-1.5">
                    <span>Create New Spreadsheet</span>
                    <span className="text-[9px] font-mono uppercase text-accent bg-accent-subtle px-1.5 py-0.2 rounded border border-accent-border font-bold">
                      Recommended
                    </span>
                  </div>
                  <div className="text-[11px] opacity-75 truncate">
                    Define your columns & create in Drive
                  </div>
                </div>
              </div>
              <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform shrink-0 ml-2" />
            </button>

            {/* Secondary Choice: Connect Existing Spreadsheet */}
            <button
              type="button"
              onClick={() => setIsConnectOpen(true)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-surface-muted hover:bg-border border border-border text-foreground transition-all active:scale-[0.98] cursor-pointer group"
            >
              <div className="flex items-center gap-3 text-left min-w-0">
                <div className="w-8 h-8 rounded-xl bg-surface border border-border flex items-center justify-center text-muted group-hover:text-foreground shrink-0">
                  <FolderOpen size={17} />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-medium">Connect Existing Spreadsheet</div>
                  <div className="text-[11px] text-muted truncate">
                    Select via Google Picker or paste link
                  </div>
                </div>
              </div>
              <ArrowRight size={14} className="text-muted group-hover:text-foreground group-hover:translate-x-0.5 transition-transform shrink-0 ml-2" />
            </button>
          </div>
        </DoubleBezelCard>

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

  // Row count calculation
  const totalRows = sheetData ? sheetData.totalRows : 0;
  const columnsCount = connectedSheet.headers.length;

  return (
    <div className="max-w-2xl mx-auto space-y-5 text-left animate-in fade-in duration-200">
      {/* Visual Command Center Hero Card */}
      <DoubleBezelCard glow className="bg-gradient-to-b from-surface to-surface-muted/60">
        {/* Spreadsheet Header / Identity */}
        <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
          <div className="min-w-0 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <h1 className="text-xs font-mono font-bold uppercase tracking-wider text-foreground truncate">
              {connectedSheet.spreadsheetTitle}
            </h1>
            <span className="text-[10px] font-mono text-muted bg-surface px-1.5 py-0.5 rounded border border-border shrink-0">
              {connectedSheet.sheetTitle}
            </span>
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

        {/* Big Live Metric & Density Visualization */}
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
            <div className="text-[11px] font-mono text-muted mt-0.5">
              {columnsCount} active columns
            </div>
          </div>

          {/* Mini Sparkline / Density Strip */}
          <div className="flex items-end gap-1 h-8 px-2 py-1 rounded-lg bg-surface-inner border border-border">
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

        {/* Primary Action Buttons: Scan & Analyze */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          <Link
            href="/scan"
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-foreground text-background text-xs font-semibold hover:opacity-90 active:scale-[0.98] shadow-sm transition-all text-center group"
          >
            <Camera size={16} weight="bold" className="text-accent group-hover:scale-110 transition-transform" />
            <span>Scan Document</span>
            <Sparkle size={13} weight="fill" className="text-accent" />
          </Link>

          <Link
            href="/analysis"
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-surface hover:bg-border border border-border text-foreground text-xs font-semibold active:scale-[0.98] transition-all text-center"
          >
            <ChartBar size={16} className="text-accent" />
            <span>Visual Analysis</span>
          </Link>
        </div>
      </DoubleBezelCard>

      {/* Real Data Preview Snapshot */}
      <DoubleBezelCard>
        <div className="flex items-center justify-between border-b border-border pb-2.5 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-surface-muted border border-border flex items-center justify-center text-muted">
              <Table size={13} />
            </div>
            <h2 className="text-xs font-semibold text-foreground">
              Recent Spreadsheet Records
            </h2>
          </div>

          <button
            type="button"
            onClick={() =>
              loadSheetData(connectedSheet.spreadsheetId, connectedSheet.sheetTitle)
            }
            disabled={isLoadingData}
            title="Refresh rows"
            className="p-1 rounded-md text-muted hover:text-foreground transition-colors cursor-pointer"
          >
            <ArrowsClockwise
              size={13}
              className={isLoadingData ? "animate-spin text-accent" : ""}
            />
          </button>
        </div>

        {isLoadingData ? (
          <div className="py-8 flex flex-col items-center justify-center text-center space-y-2.5">
            <LdrsLoader variant="hourglass" size={26} label="Fetching rows from Google Sheets" />
            <span className="text-[11px] font-mono text-muted">
              Fetching rows from Google Sheets...
            </span>
          </div>
        ) : !sheetData || sheetData.rows.length === 0 ? (
          <div className="py-6 text-center text-xs text-muted font-mono bg-surface-inner rounded-xl border border-dashed border-border p-4">
            No rows recorded yet. Use [Scan Document] to capture your first document.
          </div>
        ) : (
          <div className="space-y-3">
            {/* Scrollable Compact Snapshot Table */}
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="bg-surface-muted/60 border-b border-border text-[10.5px] text-muted">
                    <th className="py-2 px-3 font-semibold w-8 text-center">#</th>
                    {sheetData.headers.slice(0, 4).map((h, i) => (
                      <th key={i} className="py-2 px-3 font-semibold truncate max-w-[130px]">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {sheetData.rows.slice(0, 4).map((row, rowIdx) => (
                    <tr
                      key={rowIdx}
                      className="hover:bg-surface-muted/30 transition-colors"
                    >
                      <td className="py-2 px-3 text-muted text-center text-[10px]">
                        {rowIdx + 1}
                      </td>
                      {sheetData.headers.slice(0, 4).map((header, colIdx) => (
                        <td
                          key={colIdx}
                          className="py-2 px-3 text-foreground truncate max-w-[130px]"
                        >
                          {row[header] !== null && row[header] !== undefined
                            ? String(row[header])
                            : "—"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[10.5px] font-mono text-muted">
                Showing {Math.min(4, sheetData.rows.length)} of {totalRows} records
              </span>
              <Link
                href="/sheets"
                className="text-xs font-mono text-foreground hover:text-accent transition-colors flex items-center gap-1"
              >
                <span>View Full Spreadsheet Table</span>
                <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        )}
      </DoubleBezelCard>
    </div>
  );
}
