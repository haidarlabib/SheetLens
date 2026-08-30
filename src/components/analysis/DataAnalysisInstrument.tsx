"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  ChartBar,
  ArrowsClockwise,
  Hash,
  Calendar,
  Tag,
  TrendUp,
  Rows,
  Sparkle,
  ArrowSquareOut,
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

  // Active numeric column stats calculation
  const activeNumericStats = useMemo(() => {
    if (!sheetData || !selectedNumericCol) return null;
    const colAnalysis = sheetData.columnAnalysis.find(
      (c) => c.name === selectedNumericCol
    );

    let sum = 0;
    let count = 0;
    let max = -Infinity;
    let min = Infinity;

    sheetData.rows.forEach((row) => {
      const raw = row[selectedNumericCol];
      if (raw !== null && raw !== undefined) {
        const val =
          typeof raw === "number"
            ? raw
            : parseFloat(String(raw).replace(/[^0-9.-]/g, ""));
        if (!isNaN(val)) {
          sum += val;
          count += 1;
          if (val > max) max = val;
          if (val < min) min = val;
        }
      }
    });

    if (count === 0) return null;

    return {
      sum: colAnalysis?.stats?.sum ?? sum,
      avg: count > 0 ? (colAnalysis?.stats?.avg ?? sum / count) : 0,
      max: max !== -Infinity ? max : 0,
      min: min !== Infinity ? min : 0,
      count,
    };
  }, [sheetData, selectedNumericCol]);

  // Categorical aggregation
  const categoryData = useMemo(() => {
    if (!sheetData || !selectedCategoryCol) return [];
    const numCol = selectedNumericCol;

    const map = new Map<string, { count: number; sum: number }>();

    sheetData.rows.forEach((row) => {
      const cat = String(row[selectedCategoryCol] || "Unspecified").trim();
      const current = map.get(cat) || { count: 0, sum: 0 };
      current.count += 1;

      if (numCol && row[numCol] !== null && row[numCol] !== undefined) {
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
      <div className="max-w-lg mx-auto py-8 text-left animate-in fade-in duration-200">
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
            Connect a Google Spreadsheet to inspect visual charts, volume rankings, distributions, and metrics.
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
      {/* Top Banner: Dataset Identity & Interactive Dimension Selectors */}
      <DoubleBezelCard glow className="bg-gradient-to-b from-surface to-surface-muted/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4">
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
              <span>{rowsCount.toLocaleString()} Records Analyzed</span>
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

          {/* Interactive Dimension Dropdowns */}
          <div className="flex flex-wrap items-center gap-2">
            {numericColumns.length > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface border border-border text-xs font-mono">
                <Hash size={13} className="text-accent shrink-0" />
                <span className="text-muted text-[10px] uppercase">Metric:</span>
                <select
                  aria-label="Metric column"
                  value={selectedNumericCol || ""}
                  onChange={(e) => setSelectedNumericCol(e.target.value)}
                  className="bg-transparent text-foreground text-xs font-semibold focus:outline-none cursor-pointer"
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
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface border border-border text-xs font-mono">
                <Tag size={13} className="text-amber-500 shrink-0" />
                <span className="text-muted text-[10px] uppercase">Group:</span>
                <select
                  aria-label="Category column"
                  value={selectedCategoryCol || ""}
                  onChange={(e) => setSelectedCategoryCol(e.target.value)}
                  className="bg-transparent text-foreground text-xs font-semibold focus:outline-none cursor-pointer"
                >
                  {categoryColumns.map((col) => (
                    <option key={col.name} value={col.name}>
                      {col.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {dateColumns.length > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface border border-border text-xs font-mono">
                <Calendar size={13} className="text-sky-500 shrink-0" />
                <span className="text-muted text-[10px] uppercase">Date:</span>
                <select
                  aria-label="Date column"
                  value={selectedDateCol || ""}
                  onChange={(e) => setSelectedDateCol(e.target.value)}
                  className="bg-transparent text-foreground text-xs font-semibold focus:outline-none cursor-pointer"
                >
                  {dateColumns.map((col) => (
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
              className="p-2 rounded-xl bg-surface hover:bg-border border border-border text-muted hover:text-foreground transition-colors cursor-pointer"
            >
              <ArrowsClockwise
                size={14}
                className={isLoading ? "animate-spin text-accent" : ""}
              />
            </button>
          </div>
        </div>

        {/* 4 SLEEK SUMMARY METRIC TILES */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 pt-4">
          {/* Tile 1: TOTAL SUM */}
          <div className="p-3.5 rounded-2xl bg-surface border border-border space-y-1">
            <div className="text-[10.5px] font-mono text-muted uppercase tracking-wider flex items-center justify-between">
              <span>TOTAL SUM</span>
              <Hash size={12} className="text-accent" />
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-foreground truncate">
              {activeNumericStats?.sum !== undefined
                ? activeNumericStats.sum >= 1000000
                  ? `${(activeNumericStats.sum / 1000000).toFixed(2)}M`
                  : activeNumericStats.sum.toLocaleString()
                : "—"}
            </div>
            <div className="text-[10px] font-mono text-muted truncate">
              {selectedNumericCol || "Numeric Metric"}
            </div>
          </div>

          {/* Tile 2: AVERAGE VALUE */}
          <div className="p-3.5 rounded-2xl bg-surface border border-border space-y-1">
            <div className="text-[10.5px] font-mono text-muted uppercase tracking-wider flex items-center justify-between">
              <span>AVERAGE</span>
              <TrendUp size={12} className="text-emerald-500" />
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-foreground truncate">
              {activeNumericStats?.avg !== undefined
                ? activeNumericStats.avg.toFixed(1)
                : "—"}
            </div>
            <div className="text-[10px] font-mono text-muted">
              Per Record Mean
            </div>
          </div>

          {/* Tile 3: PEAK RECORD */}
          <div className="p-3.5 rounded-2xl bg-surface border border-border space-y-1">
            <div className="text-[10.5px] font-mono text-muted uppercase tracking-wider flex items-center justify-between">
              <span>PEAK RECORD</span>
              <Sparkle size={12} className="text-amber-500" />
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-foreground truncate">
              {activeNumericStats?.max !== undefined
                ? activeNumericStats.max.toLocaleString()
                : "—"}
            </div>
            <div className="text-[10px] font-mono text-muted">
              Highest Single Entry
            </div>
          </div>

          {/* Tile 4: RECORD COUNT */}
          <div className="p-3.5 rounded-2xl bg-surface border border-border space-y-1">
            <div className="text-[10.5px] font-mono text-muted uppercase tracking-wider flex items-center justify-between">
              <span>RECORDS COUNT</span>
              <Rows size={12} className="text-sky-500" />
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-foreground truncate">
              {rowsCount.toLocaleString()}
            </div>
            <div className="text-[10px] font-mono text-muted">
              {categoryData.length} Distinct Categories
            </div>
          </div>
        </div>
      </DoubleBezelCard>

      {/* MAIN VISUALIZATION WORKSPACE */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-center space-y-3 bg-surface rounded-3xl border border-border">
          <LdrsLoader variant="quantum" size={38} label="Generating visual data" />
          <div className="text-xs font-mono text-muted">
            Computing visual distributions from Google Sheets data...
          </div>
        </div>
      ) : !sheetData || sheetData.rows.length === 0 ? (
        <DoubleBezelCard className="py-12 text-center text-xs font-mono text-muted">
          No records to analyze in {connectedSheet.sheetTitle}. Capture a document to generate data.
        </DoubleBezelCard>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* PRIMARY VISUALIZATION CHART (lg:col-span-8) */}
          <div className="lg:col-span-8 space-y-5">
            {categoryData.length > 0 && (
              <DoubleBezelCard className="space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-surface-muted border border-border flex items-center justify-center text-amber-500">
                      <ChartBar size={15} />
                    </div>
                    <div>
                      <h2 className="text-xs sm:text-sm font-semibold text-foreground font-sans">
                        {selectedCategoryCol} Distribution & Ranking
                      </h2>
                      <div className="text-[11px] font-mono text-muted">
                        Measured by {selectedNumericCol ? `Sum of ${selectedNumericCol}` : "Frequency Count"}
                      </div>
                    </div>
                  </div>

                  <span className="text-[10.5px] font-mono text-muted bg-surface-inner px-2 py-0.5 rounded-full border border-border">
                    Top {categoryData.length} Categories
                  </span>
                </div>

                {/* Proportional Animated Horizontal Ranking Bars */}
                <div className="space-y-3.5 pt-1">
                  {categoryData.map((item, idx) => {
                    const maxVal = Math.max(...categoryData.map((c) => c.displayVal), 1);
                    const pct = Math.max((item.displayVal / maxVal) * 100, 4);

                    return (
                      <div key={idx} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-mono">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-5 h-5 rounded bg-surface-muted border border-border text-[10px] font-bold text-muted flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <span className="text-foreground font-semibold truncate max-w-[200px] sm:max-w-[280px]">
                              {item.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-muted font-bold">
                              {item.displayVal.toLocaleString()}
                            </span>
                            <span className="text-[10px] text-muted/60 font-mono hidden sm:inline">
                              ({((item.displayVal / (activeNumericStats?.sum || 1)) * 100).toFixed(1)}%)
                            </span>
                          </div>
                        </div>

                        {/* Animated Bar Track */}
                        <div className="w-full h-3 rounded-full bg-surface-inner border border-border overflow-hidden p-0.5">
                          <div
                            style={{ width: `${pct}%` }}
                            className={`h-full rounded-full transition-all duration-700 ease-out ${
                              idx === 0
                                ? "bg-accent"
                                : idx < 3
                                ? "bg-accent/75"
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

            {/* 100% Proportional Share Breakdown Strip */}
            {categoryData.length > 1 && (
              <DoubleBezelCard className="space-y-3.5">
                <div className="flex items-center justify-between border-b border-border pb-2.5">
                  <h3 className="text-xs font-semibold text-foreground font-sans">
                    Proportional Share Ribbon ({selectedCategoryCol})
                  </h3>
                  <span className="text-[10px] font-mono text-muted">
                    100% Relative Share
                  </span>
                </div>

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
                      {/* Segmented Ribbon */}
                      <div className="w-full h-4 rounded-full overflow-hidden flex border border-border">
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

                      {/* Legend Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs font-mono pt-1">
                        {categoryData.slice(0, 6).map((item, i) => {
                          const widthPct = ((item.displayVal / total) * 100).toFixed(1);
                          return (
                            <div key={i} className="flex items-center gap-1.5 min-w-0">
                              <span
                                className={`w-2.5 h-2.5 rounded-full shrink-0 ${colors[i % colors.length]}`}
                              />
                              <span className="text-muted truncate max-w-[100px]">
                                {item.label}
                              </span>
                              <span className="text-foreground font-semibold ml-auto">
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

          {/* SECONDARY / SUPPORTING VISUALIZATIONS (lg:col-span-4) */}
          <div className="lg:col-span-4 space-y-5">
            {/* 7-Day Activity Heatmap */}
            {weekdayActivity.length > 0 && (
              <DoubleBezelCard className="space-y-3">
                <div className="flex items-center justify-between border-b border-border pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-surface-muted border border-border flex items-center justify-center text-sky-500">
                      <Calendar size={14} />
                    </div>
                    <h3 className="text-xs font-semibold text-foreground font-sans">
                      Chronological Activity
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-muted">
                    7-Day Density
                  </span>
                </div>

                {/* 7-Day Density Grid */}
                <div className="grid grid-cols-7 gap-1.5 pt-1">
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
                          opacity: Math.max(day.intensity, 0.18),
                        }}
                        className="w-full h-12 rounded-lg bg-accent flex items-center justify-center shadow-2xs"
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

            {/* Quick Metrics Summary Card */}
            <DoubleBezelCard className="space-y-3">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <span className="text-xs font-semibold text-foreground font-sans">
                  Dataset Dimensions
                </span>
                <span className="text-[10px] font-mono text-muted">
                  Row 1 Columns
                </span>
              </div>

              <div className="space-y-1.5 text-xs font-mono text-muted">
                <div className="flex justify-between py-1 border-b border-border-subtle">
                  <span>Analyzed Rows</span>
                  <span className="text-foreground font-semibold">{rowsCount}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border-subtle">
                  <span>Numeric Columns</span>
                  <span className="text-foreground font-semibold">{numericColumns.length}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border-subtle">
                  <span>Categorical Columns</span>
                  <span className="text-foreground font-semibold">{categoryColumns.length}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>Date Columns</span>
                  <span className="text-foreground font-semibold">{dateColumns.length}</span>
                </div>
              </div>
            </DoubleBezelCard>
          </div>
        </div>
      )}
    </div>
  );
}
