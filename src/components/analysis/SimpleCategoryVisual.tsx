"use client";

import React, { useState } from "react";
import { Tag, ChartBarHorizontal } from "@phosphor-icons/react";
import { ColumnProfile } from "@/lib/eda/types";
import { DoubleBezelCard } from "@/components/ui/DoubleBezelCard";

interface SimpleCategoryVisualProps {
  categoricalColumns: ColumnProfile[];
  initialSelectedCol?: string;
}

export function SimpleCategoryVisual({
  categoricalColumns,
  initialSelectedCol,
}: SimpleCategoryVisualProps) {
  const [selectedColName, setSelectedColName] = useState<string>(
    initialSelectedCol || categoricalColumns[0]?.name || ""
  );

  const activeCol =
    categoricalColumns.find((c) => c.name === selectedColName) ||
    categoricalColumns[0];

  if (!activeCol || !activeCol.frequencies || activeCol.frequencies.length === 0) {
    return null;
  }

  const frequencies = activeCol.frequencies;
  const maxCount = Math.max(...frequencies.map((f) => f.count), 1);
  const totalFilled = frequencies.reduce((acc, f) => acc + f.count, 0) || 1;

  const segmentColors = [
    "bg-emerald-500",
    "bg-sky-500",
    "bg-amber-500",
    "bg-indigo-500",
    "bg-rose-500",
    "bg-teal-500",
    "bg-violet-500",
    "bg-orange-500",
  ];

  return (
    <DoubleBezelCard className="space-y-4 text-left">
      {/* Header & Column Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-surface-muted border border-border flex items-center justify-center text-amber-500">
            <ChartBarHorizontal size={15} />
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-semibold text-foreground font-sans">
              Yang Paling Sering Muncul ({activeCol.name})
            </h2>
            <div className="text-[11px] font-mono text-muted">
              Peringkat kemunculan nilai data dari yang terbanyak
            </div>
          </div>
        </div>

        {/* Multi-column Selector */}
        {categoricalColumns.length > 1 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface border border-border text-xs font-mono">
            <Tag size={12} className="text-amber-500 shrink-0" />
            <span className="text-muted text-[10px] uppercase">Kolom:</span>
            <select
              aria-label="Pilih kolom kategori"
              value={activeCol.name}
              onChange={(e) => setSelectedColName(e.target.value)}
              className="bg-transparent text-foreground text-xs font-semibold focus:outline-none cursor-pointer"
            >
              {categoricalColumns.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.letter} · {c.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* HORIZONTAL PROPORTIONAL RANKING BARS */}
      <div className="space-y-2.5 pt-1">
        {frequencies.map((item, idx) => {
          const widthPct = Math.max((item.count / maxCount) * 100, 4);

          return (
            <div key={idx} className="space-y-1">
              <div className="flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-5 h-5 rounded bg-surface-muted border border-border text-[10px] font-bold text-muted flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <span className="text-foreground font-semibold truncate max-w-[200px] sm:max-w-[300px]">
                    {item.label}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-foreground font-bold">
                    {item.count.toLocaleString()} baris
                  </span>
                  <span className="text-[10px] text-muted font-mono">
                    ({item.percentage.toFixed(0)}%)
                  </span>
                </div>
              </div>

              {/* Bar Track */}
              <div className="w-full h-2.5 rounded-full bg-surface-inner border border-border overflow-hidden p-0.5">
                <div
                  style={{ width: `${widthPct}%` }}
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

      {/* 100% PROPORTIONAL SHARE RIBBON */}
      {frequencies.length > 1 && (
        <div className="space-y-2.5 pt-3 border-t border-border">
          <div className="flex items-center justify-between text-xs font-mono text-muted">
            <span>Porsi Relatif Keseluruhan</span>
            <span>{frequencies.length} Macam Nilai</span>
          </div>

          {/* Ribbon */}
          <div className="w-full h-3.5 rounded-full overflow-hidden flex border border-border">
            {frequencies.map((item, i) => {
              const widthPct = (item.count / totalFilled) * 100;
              if (widthPct <= 0) return null;
              return (
                <div
                  key={i}
                  style={{ width: `${widthPct}%` }}
                  title={`${item.label}: ${widthPct.toFixed(1)}%`}
                  className={`h-full ${segmentColors[i % segmentColors.length]}`}
                />
              );
            })}
          </div>

          {/* Legend Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono pt-1">
            {frequencies.slice(0, 6).map((item, i) => {
              const widthPct = item.percentage.toFixed(0);
              return (
                <div key={i} className="flex items-center gap-1.5 min-w-0">
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      segmentColors[i % segmentColors.length]
                    }`}
                  />
                  <span className="text-muted truncate max-w-[110px]">
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
      )}
    </DoubleBezelCard>
  );
}
