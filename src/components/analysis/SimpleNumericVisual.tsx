"use client";

import React, { useState } from "react";
import { Hash, ChartBar, Sparkle } from "@phosphor-icons/react";
import { ColumnProfile } from "@/lib/eda/types";
import { DoubleBezelCard } from "@/components/ui/DoubleBezelCard";

interface SimpleNumericVisualProps {
  numericColumns: ColumnProfile[];
  initialSelectedCol?: string;
}

export function SimpleNumericVisual({
  numericColumns,
  initialSelectedCol,
}: SimpleNumericVisualProps) {
  const [selectedColName, setSelectedColName] = useState<string>(
    initialSelectedCol || numericColumns[0]?.name || ""
  );

  const activeCol =
    numericColumns.find((c) => c.name === selectedColName) || numericColumns[0];

  if (!activeCol || !activeCol.numericStats) {
    return null;
  }

  const stats = activeCol.numericStats;
  const maxBinCount = Math.max(...stats.bins.map((b) => b.count), 1);

  return (
    <DoubleBezelCard className="space-y-4 text-left">
      {/* Header & Column Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-surface-muted border border-border flex items-center justify-center text-accent">
            <ChartBar size={15} />
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-semibold text-foreground font-sans">
              Sebaran {activeCol.name}
            </h2>
            <div className="text-[11px] font-mono text-muted">
              Pola penyebaran angka dari nilai terendah hingga tertinggi
            </div>
          </div>
        </div>

        {/* Multi-column Selector */}
        {numericColumns.length > 1 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface border border-border text-xs font-mono">
            <Hash size={12} className="text-accent shrink-0" />
            <span className="text-muted text-[10px] uppercase">Kolom:</span>
            <select
              aria-label="Pilih kolom angka"
              value={activeCol.name}
              onChange={(e) => setSelectedColName(e.target.value)}
              className="bg-transparent text-foreground text-xs font-semibold focus:outline-none cursor-pointer"
            >
              {numericColumns.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.letter} · {c.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* 4 SIMPLE QUICK METRIC TILES */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3 rounded-xl bg-surface-inner border border-border text-left">
          <div className="text-[10px] font-mono text-muted uppercase">Terendah</div>
          <div className="text-base font-bold font-mono text-foreground truncate">
            {stats.min.toLocaleString()}
          </div>
          <div className="text-[9.5px] font-mono text-muted">Batas Bawah</div>
        </div>

        <div className="p-3 rounded-xl bg-surface-inner border border-border text-left">
          <div className="text-[10px] font-mono text-muted uppercase">Rata-rata</div>
          <div className="text-base font-bold font-mono text-foreground truncate">
            {stats.mean >= 10000
              ? stats.mean.toLocaleString(undefined, { maximumFractionDigits: 1 })
              : stats.mean.toFixed(1)}
          </div>
          <div className="text-[9.5px] font-mono text-muted">Nilai Tengah / Rata2</div>
        </div>

        <div className="p-3 rounded-xl bg-surface-inner border border-border text-left">
          <div className="text-[10px] font-mono text-muted uppercase">Tertinggi</div>
          <div className="text-base font-bold font-mono text-foreground truncate">
            {stats.max.toLocaleString()}
          </div>
          <div className="text-[9.5px] font-mono text-muted">Batas Atas</div>
        </div>

        <div className="p-3 rounded-xl bg-surface-inner border border-border text-left">
          <div className="text-[10px] font-mono text-muted uppercase">Total Jumlah</div>
          <div className="text-base font-bold font-mono text-foreground truncate">
            {stats.sum >= 1000000
              ? `${(stats.sum / 1000000).toFixed(2)}M`
              : stats.sum.toLocaleString()}
          </div>
          <div className="text-[9.5px] font-mono text-muted">{stats.count} Data Angka</div>
        </div>
      </div>

      {/* SIMPLE DISTRIBUTION BARS */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between text-xs font-mono text-muted">
          <span>Nilai: {stats.min.toLocaleString()}</span>
          <span>Sebaran Nilai ({activeCol.name})</span>
          <span>{stats.max.toLocaleString()}</span>
        </div>

        {/* Visual Bar Track */}
        <div className="w-full h-32 flex items-end gap-1.5 sm:gap-2 pt-4 pb-2 px-3 bg-surface-inner rounded-2xl border border-border">
          {stats.bins.map((bin, idx) => {
            const heightPct = Math.max((bin.count / maxBinCount) * 100, 4);

            return (
              <div
                key={idx}
                className="flex-1 h-full flex flex-col justify-end items-center group relative cursor-pointer"
              >
                {/* Hover Tooltip */}
                <div className="absolute -top-8 hidden group-hover:flex flex-col items-center bg-foreground text-background text-[9.5px] font-mono px-2 py-0.5 rounded shadow-md z-20 whitespace-nowrap pointer-events-none">
                  <span>
                    Rentang: {bin.binStart.toFixed(0)} – {bin.binEnd.toFixed(0)}
                  </span>
                  <span className="font-bold">
                    {bin.count} baris ({bin.percentage.toFixed(0)}%)
                  </span>
                </div>

                {/* Bar Value Count */}
                {bin.count > 0 && (
                  <span className="text-[9px] font-mono text-muted mb-1">
                    {bin.count}
                  </span>
                )}

                {/* Bar */}
                <div
                  style={{ height: `${heightPct}%` }}
                  className={`w-full rounded-t-lg transition-all duration-500 ease-out ${
                    bin.count === maxBinCount
                      ? "bg-accent"
                      : bin.count > 0
                      ? "bg-accent/70 hover:bg-accent"
                      : "bg-surface-muted/40"
                  }`}
                />

                {/* Label */}
                <span className="text-[8px] font-mono text-muted/70 truncate w-full text-center mt-1 hidden sm:block">
                  {bin.binStart >= 1000 ? `${(bin.binStart / 1000).toFixed(0)}k` : bin.binStart.toFixed(0)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </DoubleBezelCard>
  );
}
