"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  ChartBar,
  ArrowsClockwise,
  Hash,
  Calendar,
  Tag,
} from "@phosphor-icons/react";
import { ConnectedSpreadsheet, SheetDataPayload, ColumnAnalysis } from "@/lib/sheets/types";
import { DoubleBezelCard } from "@/components/ui/DoubleBezelCard";
import { LdrsLoader } from "@/components/ui/LdrsLoader";

interface DataAnalysisInstrumentProps {
  connectedSheet: ConnectedSpreadsheet | null;
}

export function DataAnalysisInstrument({ connectedSheet }: DataAnalysisInstrumentProps) {
  const [sheetData, setSheetData] = useState<SheetDataPayload | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // User interactive dimension selections
  const [selectedNumericCol, setSelectedNumericCol] = useState<string | null>(null);
  const [selectedCategoryCol, setSelectedCategoryCol] = useState<string | null>(null);
  const [selectedDateCol, setSelectedDateCol] = useState<string | null>(null);

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
        throw new Error(json.error || "Failed to load spreadsheet data for analysis.");
      }
      setSheetData(json.data);

      // Auto-select best default columns for visualization
      const cols: ColumnAnalysis[] = json.data.columnAnalysis || [];
      const numCol = cols.find((c) => c.type === "number");
      const catCol = cols.find((c) => c.type === "category" || c.type === "text");
      const dateCol = cols.find((c) => c.type === "date");

      if (numCol) setSelectedNumericCol(numCol.name);
      if (catCol) setSelectedCategoryCol(catCol.name);
      if (dateCol) setSelectedDateCol(dateCol.name);
    } catch (err: unknown) {
      console.error("Error loading analysis data:", err);
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to load spreadsheet data."
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

  // Derived datasets
  const numericColumns = useMemo(
    () => sheetData?.columnAnalysis.filter((c) => c.type === "number") || [],
    [sheetData]
  );
  const categoryColumns = useMemo(
    () =>
      sheetData?.columnAnalysis.filter(
        (c) => c.type === "category" || c.type === "text"
      ) || [],
    [sheetData]
  );
  const dateColumns = useMemo(
    () => sheetData?.columnAnalysis.filter((c) => c.type === "date") || [],
    [sheetData]
  );

  // Categorical aggregation
  const categoryData = useMemo(() => {
    if (!sheetData || !selectedCategoryCol) return [];
    const numCol = selectedNumericCol;

    const map = new Map<string, { count: number; sum: number }>();

    sheetData.rows.forEach((row) => {
      const cat = String(row[selectedCategoryCol] || "Unspecified").trim();
      const current = map.get(cat) || { count: 0, sum: 0 };
      current.count += 1;

      if (numCol && row[numCol] !== null) {
        const val =
          typeof row[numCol] === "number"
            ? (row[numCol] as number)
            : parseFloat(String(row[numCol]).replace(/[^0-9.-]/g, ""));
        if (!isNaN(val)) current.sum += val;
      }
      map.set(cat, current);
    });

    const list = Array.from(map.entries()).map(([label, metrics]) => ({
      label,
      count: metrics.count,
      sum: metrics.sum,
      displayVal: numCol ? metrics.sum : metrics.count,
    }));

    return list.sort((a, b) => b.displayVal - a.displayVal).slice(0, 10);
  }, [sheetData, selectedCategoryCol, selectedNumericCol]);

  // Day of week activity heatmap
  const weekdayActivity = useMemo(() => {
    if (!sheetData || !selectedDateCol) return [];
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const counts = [0, 0, 0, 0, 0, 0, 0];

    sheetData.rows.forEach((row) => {
      const dStr = row[selectedDateCol];
      if (dStr) {
        const parsed = new Date(String(dStr));
        if (!isNaN(parsed.getTime())) {
          const dayIdx = (parsed.getDay() + 6) % 7; // Mon = 0, Sun = 6
          counts[dayIdx] += 1;
        }
      }
    });

    const max = Math.max(...counts, 1);
    return days.map((day, idx) => ({
      day,
      count: counts[idx],
      intensity: counts[idx] / max,
    }));
  }, [sheetData, selectedDateCol]);

  if (!connectedSheet) {
    return (
      <div className="max-w-lg mx-auto py-8 text-left">
        <DoubleBezelCard glow className="border-dashed">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-surface-muted border border-border flex items-center justify-center text-accent">
              <ChartBar size={16} />
            </div>
            <h1 className="text-sm font-semibold text-foreground">
              Visual Analysis Instrument
            </h1>
          </div>
          <p className="text-xs text-muted leading-relaxed mb-4">
            Connect a Google Spreadsheet to inspect visual charts, distributions, and metrics.
          </p>
          <Link
            href="/sheets"
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-foreground text-background text-xs font-semibold hover:opacity-90 transition-all text-center"
          >
            <span>Connect Spreadsheet</span>
          </Link>
        </DoubleBezelCard>
      </div>
    );
  }

  const rowsCount = sheetData ? sheetData.totalRows : 0;

  return (
    <div className="space-y-6 text-left animate-in fade-in duration-200">
      {/* Top Banner: Instrument Header & Live Controls */}
      <DoubleBezelCard glow className="bg-gradient-to-b from-surface to-surface-muted/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3.5">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="w-2 h-2 rounded-full bg-accent" />
              <h1 className="text-xs font-mono font-bold uppercase tracking-wider text-foreground truncate">
                {connectedSheet.spreadsheetTitle}
              </h1>
              <span className="text-[10px] font-mono text-muted bg-surface px-1.5 py-0.5 rounded border border-border shrink-0">
                {connectedSheet.sheetTitle}
              </span>
            </div>
            <div className="text-xs font-mono text-muted">
              {rowsCount.toLocaleString()} Records Analyzed
            </div>
          </div>

          {/* Dimension Selectors Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            {numericColumns.length > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-surface border border-border text-xs font-mono">
                <Hash size={12} className="text-accent shrink-0" />
                <select
                  aria-label="Metric column"
                  value={selectedNumericCol || ""}
                  onChange={(e) => setSelectedNumericCol(e.target.value)}
                  className="bg-transparent text-foreground text-xs focus:outline-none cursor-pointer"
                >
                  {numericColumns.map((col) => (
                    <option key={col.name} value={col.name}>
                      {col.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {categoryColumns.length > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-surface border border-border text-xs font-mono">
                <Tag size={12} className="text-amber-500 shrink-0" />
                <select
                  aria-label="Category column"
                  value={selectedCategoryCol || ""}
                  onChange={(e) => setSelectedCategoryCol(e.target.value)}
                  className="bg-transparent text-foreground text-xs focus:outline-none cursor-pointer"
                >
                  {categoryColumns.map((col) => (
                    <option key={col.name} value={col.name}>
                      {col.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              type="button"
              onClick={() =>
                loadData(connectedSheet.spreadsheetId, connectedSheet.sheetTitle)
              }
              disabled={isLoading}
              title="Refresh analysis data"
              className="p-1.5 rounded-xl bg-surface hover:bg-border border border-border text-muted hover:text-foreground transition-colors cursor-pointer"
            >
              <ArrowsClockwise
                size={14}
                className={isLoading ? "animate-spin text-accent" : ""}
              />
            </button>
          </div>
        </div>

        {/* Numeric Metric Summary Grid */}
        {numericColumns.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3.5">
            {numericColumns.map((col) => (
              <div
                key={col.name}
                onClick={() => setSelectedNumericCol(col.name)}
                className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                  selectedNumericCol === col.name
                    ? "bg-surface-inner border-accent shadow-xs"
                    : "bg-surface border-border hover:border-border-strong"
                }`}
              >
                <div className="text-[10.5px] font-mono text-muted uppercase tracking-wider truncate mb-1">
                  {col.name}
                </div>
                <div className="text-lg sm:text-xl font-bold font-mono text-foreground truncate">
                  {col.stats?.sum !== undefined
                    ? col.stats.sum >= 1000000
                      ? `${(col.stats.sum / 1000000).toFixed(1)}M`
                      : col.stats.sum.toLocaleString()
                    : "—"}
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono text-muted mt-1 pt-1 border-t border-border-subtle">
                  <span>Avg {col.stats?.avg?.toFixed(1) || "0"}</span>
                  <span className="text-accent font-bold">Sum</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="pt-3 text-xs font-mono text-muted">
            No numeric columns detected in Row 1. Showing categorical frequencies.
          </div>
        )}
      </DoubleBezelCard>

      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-center space-y-3 bg-surface rounded-3xl border border-border">
          <LdrsLoader variant="quantum" size={36} label="Calculating visual distributions" />
          <div className="text-xs font-mono text-muted">
            Calculating visual distributions from Google Sheets data...
          </div>
        </div>
      ) : !sheetData || sheetData.rows.length === 0 ? (
        <DoubleBezelCard className="py-12 text-center text-xs font-mono text-muted">
          No records to analyze in {connectedSheet.sheetTitle}. Capture a document to generate data.
        </DoubleBezelCard>
      ) : (
        /* Visual Visualizations Canvas */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* 1. Categorical Distribution / Ranking Bar Chart */}
          {categoryData.length > 0 && (
            <DoubleBezelCard className="space-y-3">
              <div className="flex items-center justify-between border-b border-border pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-surface-muted border border-border flex items-center justify-center text-amber-500">
                    <ChartBar size={14} />
                  </div>
                  <h2 className="text-xs font-semibold text-foreground font-sans">
                    {selectedCategoryCol} Ranking
                  </h2>
                </div>
                <span className="text-[10px] font-mono text-muted">
                  Top {categoryData.length}
                </span>
              </div>

              {/* Horizontal Proportional Bars */}
              <div className="space-y-2.5 pt-1">
                {categoryData.map((item, idx) => {
                  const maxVal = Math.max(
                    ...categoryData.map((c) => c.displayVal),
                    1
                  );
                  const pct = Math.max((item.displayVal / maxVal) * 100, 3);

                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-foreground truncate max-w-[180px]">
                          {item.label}
                        </span>
                        <span className="text-muted font-semibold">
                          {item.displayVal.toLocaleString()}
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-surface-inner border border-border overflow-hidden">
                        <div
                          style={{ width: `${pct}%` }}
                          className={`h-full rounded-full transition-all duration-500 ${
                            idx === 0
                              ? "bg-accent"
                              : idx < 3
                              ? "bg-accent/70"
                              : "bg-muted/40"
                          }`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </DoubleBezelCard>
          )}

          {/* 2. Chronological Activity / Weekday Heatmap */}
          {weekdayActivity.length > 0 && (
            <DoubleBezelCard className="space-y-3">
              <div className="flex items-center justify-between border-b border-border pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-surface-muted border border-border flex items-center justify-center text-sky-500">
                    <Calendar size={14} />
                  </div>
                  <h2 className="text-xs font-semibold text-foreground font-sans">
                    Activity Heatmap
                  </h2>
                </div>
                <span className="text-[10px] font-mono text-muted">
                  By Day of Week
                </span>
              </div>

              {/* 7-Day Density Blocks */}
              <div className="grid grid-cols-7 gap-1.5 pt-2">
                {weekdayActivity.map((day) => (
                  <div
                    key={day.day}
                    className="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-surface-inner border border-border text-center"
                  >
                    <span className="text-[10px] font-mono text-muted">
                      {day.day}
                    </span>
                    <div
                      style={{
                        opacity: Math.max(day.intensity, 0.15),
                      }}
                      className="w-full h-10 rounded-lg bg-accent flex items-center justify-center"
                    >
                      <span className="text-xs font-mono font-bold text-white">
                        {day.count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </DoubleBezelCard>
          )}

          {/* 3. Proportional Breakdown Strip */}
          {categoryData.length > 1 && (
            <DoubleBezelCard className="md:col-span-2 space-y-3">
              <div className="flex items-center justify-between border-b border-border pb-2.5">
                <h2 className="text-xs font-semibold text-foreground font-sans">
                  Volume Share Breakdown ({selectedCategoryCol})
                </h2>
                <span className="text-[10px] font-mono text-muted">
                  100% Proportional
                </span>
              </div>

              {/* Multi-segment Proportional Strip */}
              {(() => {
                const total = categoryData.reduce((acc, c) => acc + c.displayVal, 0) || 1;
                const colors = [
                  "bg-emerald-500",
                  "bg-sky-500",
                  "bg-amber-500",
                  "bg-indigo-500",
                  "bg-rose-500",
                  "bg-teal-500",
                ];

                return (
                  <div className="space-y-3 pt-1">
                    <div className="w-full h-3.5 rounded-full overflow-hidden flex border border-border">
                      {categoryData.map((item, i) => {
                        const widthPct = (item.displayVal / total) * 100;
                        if (widthPct <= 0) return null;
                        return (
                          <div
                            key={i}
                            style={{ width: `${widthPct}%` }}
                            title={`${item.label}: ${widthPct.toFixed(1)}%`}
                            className={`h-full ${colors[i % colors.length]}`}
                          />
                        );
                      })}
                    </div>

                    {/* Compact Legend */}
                    <div className="flex flex-wrap gap-3 text-xs font-mono">
                      {categoryData.slice(0, 6).map((item, i) => {
                        const widthPct = ((item.displayVal / total) * 100).toFixed(1);
                        return (
                          <div key={i} className="flex items-center gap-1.5">
                            <span
                              className={`w-2.5 h-2.5 rounded-full ${colors[i % colors.length]}`}
                            />
                            <span className="text-muted truncate max-w-[110px]">
                              {item.label}
                            </span>
                            <span className="text-foreground font-semibold">
                              {widthPct}%
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </DoubleBezelCard>
          )}
        </div>
      )}
    </div>
  );
}
