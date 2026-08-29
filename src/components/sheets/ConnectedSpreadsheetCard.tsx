"use client";

import React, { useState } from "react";
import {
  Table,
  CheckCircle,
  ArrowsClockwise,
  ArrowSquareOut,
  Trash,
  Sliders,
  CircleNotch,
} from "@phosphor-icons/react";
import { ConnectedSpreadsheet, SheetColumnHeader } from "@/lib/sheets/types";
import { DoubleBezelCard } from "@/components/ui/DoubleBezelCard";

interface ConnectedSpreadsheetCardProps {
  spreadsheet: ConnectedSpreadsheet;
  onChangeSpreadsheet: () => void;
  onDisconnect: () => void;
  onUpdateHeaders: (updated: ConnectedSpreadsheet) => void;
}

export function ConnectedSpreadsheetCard({
  spreadsheet,
  onChangeSpreadsheet,
  onDisconnect,
  onUpdateHeaders,
}: ConnectedSpreadsheetCardProps) {
  const [isRescanning, setIsRescanning] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const handleRescan = async () => {
    setIsRescanning(true);
    try {
      const res = await fetch(
        `/api/sheets/headers?spreadsheetId=${encodeURIComponent(
          spreadsheet.spreadsheetId
        )}&sheetTitle=${encodeURIComponent(spreadsheet.sheetTitle)}`
      );
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to re-scan headers");
      }

      // Update connected sheet on server
      const saveRes = await fetch("/api/sheets/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          spreadsheetId: spreadsheet.spreadsheetId,
          spreadsheetTitle: spreadsheet.spreadsheetTitle,
          sheetId: spreadsheet.sheetId,
          sheetTitle: spreadsheet.sheetTitle,
          headers: json.data.headers,
          headerCount: json.data.headerCount,
        }),
      });

      const saveJson = await saveRes.json();
      if (saveRes.ok && saveJson.success) {
        onUpdateHeaders(saveJson.data);
      }
    } catch (err) {
      console.error("Failed to rescan headers:", err);
    } finally {
      setIsRescanning(false);
    }
  };

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      await fetch("/api/sheets/disconnect", { method: "POST" });
      onDisconnect();
    } catch (err) {
      console.error("Failed to disconnect sheet:", err);
    } finally {
      setIsDisconnecting(false);
    }
  };

  return (
    <DoubleBezelCard glow className="w-full">
      {/* Card Header */}
      <div className="flex items-center justify-between border-b border-border pb-3 mb-3.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-surface-muted border border-border flex items-center justify-center text-foreground">
            <Table size={15} />
          </div>
          <span className="text-[10.5px] font-mono uppercase tracking-wider text-muted">
            Active Spreadsheet
          </span>
        </div>

        <div className="flex items-center gap-1 text-[11px] font-mono text-accent bg-accent-subtle border border-accent-border px-2 py-0.5 rounded-full">
          <CheckCircle size={12} weight="fill" />
          <span>Connected</span>
        </div>
      </div>

      {/* Spreadsheet Info */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-semibold text-foreground truncate">
              {spreadsheet.spreadsheetTitle}
            </h2>
            <div className="flex items-center gap-2 text-xs text-muted font-mono mt-0.5">
              <span>Sheet tab:</span>
              <span className="px-1.5 py-0.5 rounded bg-surface-muted border border-border text-foreground font-semibold">
                {spreadsheet.sheetTitle}
              </span>
            </div>
          </div>

          <a
            href={spreadsheet.spreadsheetUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Open in Google Sheets"
            className="p-2 rounded-xl bg-surface-muted hover:bg-border border border-border text-muted hover:text-foreground transition-colors shrink-0"
          >
            <ArrowSquareOut size={15} />
          </a>
        </div>

        {/* Column Headers Section */}
        <div className="pt-2 border-t border-border-subtle">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-medium text-muted">
              Discovered Schema ({spreadsheet.headerCount} columns)
            </span>
            <button
              type="button"
              onClick={handleRescan}
              disabled={isRescanning}
              title="Re-scan row 1 headers"
              className="inline-flex items-center gap-1 text-[10.5px] font-mono text-muted hover:text-foreground transition-colors cursor-pointer"
            >
              <ArrowsClockwise
                size={12}
                className={isRescanning ? "animate-spin text-accent" : ""}
              />
              <span>{isRescanning ? "Scanning..." : "Re-scan"}</span>
            </button>
          </div>

          {/* Column Pills List */}
          <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1.5 rounded-xl bg-surface-inner border border-border">
            {spreadsheet.headers.map((col: SheetColumnHeader) => (
              <span
                key={col.index}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-mono border ${
                  col.valid
                    ? "bg-surface border-border text-foreground"
                    : "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-300"
                }`}
              >
                <span className="text-[9px] font-bold text-muted bg-surface-muted px-1 py-0.2 rounded">
                  {col.letter}
                </span>
                <span className="truncate max-w-[120px]">{col.name}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Action Controls */}
        <div className="pt-2 flex items-center gap-2">
          <button
            type="button"
            onClick={onChangeSpreadsheet}
            className="flex-1 py-2.5 rounded-xl bg-surface-muted hover:bg-border border border-border text-xs font-medium text-foreground transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Sliders size={14} />
            <span>Change Sheet</span>
          </button>

          <button
            type="button"
            onClick={handleDisconnect}
            disabled={isDisconnecting}
            className="px-3.5 py-2.5 rounded-xl bg-surface hover:bg-rose-500/10 border border-border hover:border-rose-500/20 text-muted hover:text-rose-500 text-xs font-medium transition-colors cursor-pointer flex items-center justify-center gap-1"
          >
            {isDisconnecting ? (
              <CircleNotch size={14} className="animate-spin" />
            ) : (
              <Trash size={14} />
            )}
            <span className="hidden xs:inline">Disconnect</span>
          </button>
        </div>
      </div>
    </DoubleBezelCard>
  );
}
