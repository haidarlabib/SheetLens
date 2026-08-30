"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  ArrowsClockwise,
  ArrowSquareOut,
  Database,
  Sparkle,
} from "@phosphor-icons/react";
import { ConnectedSpreadsheet, SheetDataPayload } from "@/lib/sheets/types";
import { DoubleBezelCard } from "@/components/ui/DoubleBezelCard";
import { LdrsLoader } from "@/components/ui/LdrsLoader";
import { profileDataset } from "@/lib/eda/profiler";
import { DatasetOverviewCards } from "./DatasetOverviewCards";
import { WhatsInsideCards } from "./WhatsInsideCards";
import { SimpleNumericVisual } from "./SimpleNumericVisual";
import { SimpleCategoryVisual } from "./SimpleCategoryVisual";
import { SimpleTimelineVisual } from "./SimpleTimelineVisual";

interface DataAnalysisInstrumentProps {
  connectedSheet: ConnectedSpreadsheet | null;
}

export function DataAnalysisInstrument({
  connectedSheet,
}: DataAnalysisInstrumentProps) {
  const [sheetData, setSheetData] = useState<SheetDataPayload | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Active focused column for inspection
  const [focusedColumn, setFocusedColumn] = useState<string | null>(null);

  const loadData = async (spreadsheetId: string, sheetTitle: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch(
        `/api/sheets/data?spreadsheetId=${encodeURIComponent(
          spreadsheetId
        )}&sheetTitle=${encodeURIComponent(sheetTitle)}&limit=300`
      );
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(
          json.error || "Gagal memuat data spreadsheet untuk visualisasi."
        );
      }
      setSheetData(json.data);
    } catch (err: unknown) {
      console.error("Error loading analysis data:", err);
      setErrorMessage(
        err instanceof Error ? err.message : "Gagal memuat data spreadsheet."
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

  // Compute full deterministic EDA Profile
  const profile = useMemo(() => {
    if (!sheetData || sheetData.rows.length === 0 || !sheetData.headers) {
      return null;
    }
    return profileDataset(sheetData.headers, sheetData.rows);
  }, [sheetData]);

  // Auto-focus first notable column if none selected
  useEffect(() => {
    if (profile && !focusedColumn) {
      if (profile.numericColumns.length > 0) {
        setFocusedColumn(profile.numericColumns[0].name);
      } else if (profile.categoricalColumns.length > 0) {
        setFocusedColumn(profile.categoricalColumns[0].name);
      } else if (profile.temporalColumns.length > 0) {
        setFocusedColumn(profile.temporalColumns[0].name);
      } else if (profile.columns.length > 0) {
        setFocusedColumn(profile.columns[0].name);
      }
    }
  }, [profile, focusedColumn]);

  if (!connectedSheet) {
    return (
      <div className="max-w-lg mx-auto py-8 text-left animate-in fade-in duration-200">
        <DoubleBezelCard glow className="border-dashed">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-surface-muted border border-border flex items-center justify-center text-accent">
              <Database size={16} />
            </div>
            <h1 className="text-sm font-semibold text-foreground">
              Visual Data SheetLens
            </h1>
          </div>
          <p className="text-xs text-muted leading-relaxed mb-4">
            Hubungkan Google Spreadsheet Anda untuk melihat isi tabel, jumlah
            data, dan polanya secara visual tanpa istilah teknis yang rumit.
          </p>
          <Link
            href="/sheets"
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-foreground text-background text-xs font-semibold hover:opacity-90 transition-all text-center cursor-pointer"
          >
            <span>Hubungkan Spreadsheet</span>
          </Link>
        </DoubleBezelCard>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left animate-in fade-in duration-200">
      {/* Top Banner: Dataset Identity & Status */}
      <DoubleBezelCard
        glow
        className="bg-gradient-to-b from-surface to-surface-muted/40"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse shrink-0" />
              <h1 className="text-xs sm:text-sm font-mono font-bold uppercase tracking-wider text-foreground truncate">
                {connectedSheet.spreadsheetTitle}
              </h1>
              <span className="text-[10px] font-mono text-muted bg-surface px-1.5 py-0.5 rounded border border-border shrink-0">
                {connectedSheet.sheetTitle}
              </span>
            </div>
            <div className="text-xs font-mono text-muted flex items-center gap-2">
              <span>Visual Data Spreadsheet</span>
              <span>·</span>
              <a
                href={connectedSheet.spreadsheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline inline-flex items-center gap-1"
              >
                <span>Google Sheets</span>
                <ArrowSquareOut size={12} />
              </a>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {profile && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface border border-border text-xs font-mono text-muted">
                <span className="text-foreground font-semibold">
                  {profile.totalRows.toLocaleString()}
                </span>
                <span>Baris</span>
                <span>×</span>
                <span className="text-foreground font-semibold">
                  {profile.totalColumns}
                </span>
                <span>Kolom</span>
              </div>
            )}

            <button
              type="button"
              onClick={() =>
                loadData(connectedSheet.spreadsheetId, connectedSheet.sheetTitle)
              }
              disabled={isLoading}
              title="Muat ulang data spreadsheet"
              className="p-2 rounded-xl bg-surface hover:bg-border border border-border text-muted hover:text-foreground transition-colors cursor-pointer"
            >
              <ArrowsClockwise
                size={14}
                className={isLoading ? "animate-spin text-accent" : ""}
              />
            </button>
          </div>
        </div>

        {/* 1. DATASET OVERVIEW TILES */}
        {profile && (
          <div className="pt-4 border-t border-border mt-4">
            <DatasetOverviewCards profile={profile} />
          </div>
        )}
      </DoubleBezelCard>

      {/* ERROR MESSAGE */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-mono">
          {errorMessage}
        </div>
      )}

      {/* MAIN VISUAL WORKSPACE */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-center space-y-3 bg-surface rounded-3xl border border-border">
          <LdrsLoader variant="quantum" size={38} label="Membaca isi data" />
          <div className="text-xs font-mono text-muted">
            Memproses isi tabel dan menyiapkan visualisasi data...
          </div>
        </div>
      ) : !profile || profile.totalRows === 0 ? (
        <DoubleBezelCard className="py-12 text-center text-xs font-mono text-muted">
          Belum ada baris data di tab {connectedSheet.sheetTitle}. Pindai dokumen
          untuk mengisi data secara otomatis.
        </DoubleBezelCard>
      ) : (
        <div className="space-y-6">
          {/* 2. WHAT'S INSIDE (Karakter & Isi Setiap Kolom) */}
          <WhatsInsideCards
            columns={profile.columns}
            selectedColumnName={focusedColumn}
            onSelectColumn={(colName) => setFocusedColumn(colName)}
          />

          {/* 3. SIMPLE VISUALS (Pola & Sebaran Nilai) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* Visual 1: Numeric Distribution (if numeric columns exist) */}
            {profile.numericColumns.length > 0 && (
              <SimpleNumericVisual
                numericColumns={profile.numericColumns}
                initialSelectedCol={
                  profile.numericColumns.some((c) => c.name === focusedColumn)
                    ? focusedColumn || undefined
                    : undefined
                }
              />
            )}

            {/* Visual 2: Category / Text Frequency (if categorical columns exist) */}
            {profile.categoricalColumns.length > 0 && (
              <SimpleCategoryVisual
                categoricalColumns={profile.categoricalColumns}
                initialSelectedCol={
                  profile.categoricalColumns.some((c) => c.name === focusedColumn)
                    ? focusedColumn || undefined
                    : undefined
                }
              />
            )}

            {/* Visual 3: Temporal Timeline (if date columns exist) */}
            {profile.temporalColumns.length > 0 && (
              <div className="lg:col-span-2">
                <SimpleTimelineVisual
                  temporalColumns={profile.temporalColumns}
                  initialSelectedCol={
                    profile.temporalColumns.some((c) => c.name === focusedColumn)
                      ? focusedColumn || undefined
                      : undefined
                  }
                />
              </div>
            )}

            {/* Pure Text Case fallback card */}
            {profile.numericColumns.length === 0 &&
              profile.categoricalColumns.length === 0 &&
              profile.temporalColumns.length === 0 && (
                <div className="lg:col-span-2">
                  <DoubleBezelCard className="p-6 space-y-2 text-left">
                    <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
                      <Sparkle size={16} className="text-amber-500" />
                      <span>Data Teks Lengkap</span>
                    </div>
                    <p className="text-xs font-mono text-muted leading-relaxed">
                      Seluruh kolom di spreadsheet ini berisi teks bebas. Anda
                      dapat melihat rincian isi setiap kolom pada kartu di atas.
                    </p>
                  </DoubleBezelCard>
                </div>
              )}
          </div>
        </div>
      )}
    </div>
  );
}
