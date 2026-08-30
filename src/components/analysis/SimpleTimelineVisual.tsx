"use client";

import React, { useState } from "react";
import { Calendar, ChartLineUp } from "@phosphor-icons/react";
import { ColumnProfile } from "@/lib/eda/types";
import { DoubleBezelCard } from "@/components/ui/DoubleBezelCard";

interface SimpleTimelineVisualProps {
  temporalColumns: ColumnProfile[];
  initialSelectedCol?: string;
}

export function SimpleTimelineVisual({
  temporalColumns,
  initialSelectedCol,
}: SimpleTimelineVisualProps) {
  const [selectedColName, setSelectedColName] = useState<string>(
    initialSelectedCol || temporalColumns[0]?.name || ""
  );

  const activeCol =
    temporalColumns.find((c) => c.name === selectedColName) ||
    temporalColumns[0];

  if (!activeCol || !activeCol.temporalStats) {
    return null;
  }

  const stats = activeCol.temporalStats;
  const timePoints = stats.timePoints;
  const maxCount = Math.max(...timePoints.map((tp) => tp.count), 1);
  const maxDayCount = Math.max(...stats.dayOfWeekDistribution.map((d) => d.count), 1);

  // Indonesian day names mapping
  const idnDays: Record<string, string> = {
    Mon: "Sen",
    Tue: "Sel",
    Wed: "Rab",
    Thu: "Kam",
    Fri: "Jum",
    Sat: "Sab",
    Sun: "Min",
  };

  return (
    <DoubleBezelCard className="space-y-4 text-left">
      {/* Header & Date Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-surface-muted border border-border flex items-center justify-center text-sky-500">
            <Calendar size={15} />
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-semibold text-foreground font-sans">
              Data dari Waktu ke Waktu ({activeCol.name})
            </h2>
            <div className="text-[11px] font-mono text-muted">
              Pencatatan data dari {stats.minDate} hingga {stats.maxDate}
            </div>
          </div>
        </div>

        {/* Multi-column Selector */}
        {temporalColumns.length > 1 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface border border-border text-xs font-mono">
            <Calendar size={12} className="text-sky-500 shrink-0" />
            <span className="text-muted text-[10px] uppercase">Kolom:</span>
            <select
              aria-label="Pilih kolom tanggal"
              value={activeCol.name}
              onChange={(e) => setSelectedColName(e.target.value)}
              className="bg-transparent text-foreground text-xs font-semibold focus:outline-none cursor-pointer"
            >
              {temporalColumns.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.letter} · {c.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* CHRONOLOGICAL TIMELINE BARS */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between text-xs font-mono text-muted">
          <span>{stats.minDate}</span>
          <span>Jumlah Data per Tanggal</span>
          <span>{stats.maxDate}</span>
        </div>

        {/* Time Points Bar Track */}
        <div className="w-full h-28 flex items-end gap-1 sm:gap-1.5 pt-4 pb-2 px-2 bg-surface-inner rounded-2xl border border-border overflow-x-auto">
          {timePoints.map((point, idx) => {
            const heightPct = Math.max((point.count / maxCount) * 100, 4);

            return (
              <div
                key={idx}
                className="flex-1 min-w-[16px] h-full flex flex-col justify-end items-center group relative cursor-pointer"
              >
                {/* Tooltip */}
                <div className="absolute -top-8 hidden group-hover:flex flex-col items-center bg-foreground text-background text-[9.5px] font-mono px-2 py-0.5 rounded shadow-md z-20 whitespace-nowrap pointer-events-none">
                  <span>{point.period}</span>
                  <span className="font-bold">{point.count} data</span>
                </div>

                {/* Animated Timeline Bar */}
                <div
                  style={{ height: `${heightPct}%` }}
                  className="w-full rounded-t-sm bg-sky-500/80 hover:bg-sky-500 transition-all duration-500 ease-out"
                />

                {/* Period Label */}
                <span className="text-[7.5px] font-mono text-muted/60 truncate w-full text-center mt-1">
                  {point.period.slice(5)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 7-DAY DAY OF WEEK CYCLICAL ACTIVITY */}
      <div className="space-y-2 pt-2 border-t border-border">
        <div className="flex items-center justify-between text-xs font-mono text-muted">
          <span>Kapan data paling sering tercatat?</span>
          <span>Hari dalam Seminggu</span>
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {stats.dayOfWeekDistribution.map((d) => {
            const intensity = maxDayCount > 0 ? d.count / maxDayCount : 0;

            return (
              <div
                key={d.day}
                className="flex flex-col items-center gap-1 p-2 rounded-xl bg-surface-inner border border-border text-center"
              >
                <span className="text-[10px] font-mono text-muted">
                  {idnDays[d.day] || d.day}
                </span>
                <div
                  style={{
                    opacity: Math.max(intensity, 0.18),
                  }}
                  className="w-full h-8 rounded-lg bg-sky-500 flex items-center justify-center shadow-2xs"
                >
                  <span className="text-xs font-mono font-bold text-white">
                    {d.count}
                  </span>
                </div>
                <span className="text-[9px] font-mono text-muted/70">
                  {d.percentage.toFixed(0)}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </DoubleBezelCard>
  );
}
