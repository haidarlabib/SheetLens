"use client";

import React from "react";
import {
  Hash,
  Calendar,
  Tag,
  TextAlignLeft,
  CheckSquare,
  Sparkle,
} from "@phosphor-icons/react";
import { ColumnProfile, EdaDataType } from "@/lib/eda/types";
import { DoubleBezelCard } from "@/components/ui/DoubleBezelCard";

interface WhatsInsideCardsProps {
  columns: ColumnProfile[];
  selectedColumnName?: string | null;
  onSelectColumn?: (colName: string) => void;
}

export function WhatsInsideCards({
  columns,
  selectedColumnName,
  onSelectColumn,
}: WhatsInsideCardsProps) {
  const getSimpleType = (type: EdaDataType) => {
    switch (type) {
      case "integer":
      case "decimal":
      case "number":
        return {
          label: "ANGKA",
          icon: <Hash size={11} className="text-accent" />,
          badgeBg: "bg-accent/10 border-accent/30 text-accent",
        };
      case "date":
      case "datetime":
        return {
          label: type === "datetime" ? "TANGGAL & WAKTU" : "TANGGAL",
          icon: <Calendar size={11} className="text-sky-500" />,
          badgeBg: "bg-sky-500/10 border-sky-500/30 text-sky-500",
        };
      case "category":
        return {
          label: "PILIHAN / KATEGORI",
          icon: <Tag size={11} className="text-amber-500" />,
          badgeBg: "bg-amber-500/10 border-amber-500/30 text-amber-500",
        };
      case "boolean":
        return {
          label: "YA / TIDAK",
          icon: <CheckSquare size={11} className="text-emerald-500" />,
          badgeBg: "bg-emerald-500/10 border-emerald-500/30 text-emerald-500",
        };
      case "text":
      default:
        return {
          label: "TEKS",
          icon: <TextAlignLeft size={11} className="text-muted" />,
          badgeBg: "bg-surface-muted border-border text-muted",
        };
    }
  };

  return (
    <DoubleBezelCard className="space-y-4 text-left">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-surface-muted border border-border flex items-center justify-center text-accent">
            <Sparkle size={15} />
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-semibold text-foreground font-sans">
              Isi &amp; Karakter Kolom
            </h2>
            <div className="text-[11px] font-mono text-muted">
              Ringkasan cepat setiap kolom di tabel spreadsheet Anda
            </div>
          </div>
        </div>
        <span className="text-[10px] font-mono text-muted bg-surface px-2 py-0.5 rounded-full border border-border">
          {columns.length} Kolom
        </span>
      </div>

      {/* Grid of Compact Column Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {columns.map((col) => {
          const typeInfo = getSimpleType(col.type);
          const isSelected = selectedColumnName === col.name;

          return (
            <div
              key={col.name}
              onClick={() => onSelectColumn?.(col.name)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-2.5 ${
                isSelected
                  ? "bg-accent/5 border-accent/70 shadow-xs"
                  : "bg-surface hover:bg-surface-muted/50 border-border"
              }`}
            >
              {/* Header: Letter + Column Name + Type Badge */}
              <div className="flex items-start justify-between gap-1.5">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="w-5 h-5 rounded bg-surface-inner border border-border text-[10px] font-mono font-bold text-muted flex items-center justify-center shrink-0">
                    {col.letter}
                  </span>
                  <span className="text-xs font-mono font-bold text-foreground truncate" title={col.name}>
                    {col.name}
                  </span>
                </div>

                <span
                  className={`inline-flex items-center gap-1 text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded border shrink-0 ${typeInfo.badgeBg}`}
                >
                  {typeInfo.icon}
                  {typeInfo.label}
                </span>
              </div>

              {/* Middle: Human-readable Summary */}
              <div className="text-xs font-mono text-foreground space-y-1">
                {col.numericStats && (
                  <div className="text-[11px] text-muted">
                    <span>Rentang: </span>
                    <span className="font-bold text-foreground">
                      {col.numericStats.min.toLocaleString()} — {col.numericStats.max.toLocaleString()}
                    </span>
                    <div className="text-[10px] text-muted">
                      Rata-rata: {col.numericStats.mean >= 1000 ? col.numericStats.mean.toLocaleString(undefined, { maximumFractionDigits: 1 }) : col.numericStats.mean.toFixed(1)}
                    </div>
                  </div>
                )}

                {col.frequencies && col.frequencies.length > 0 && (
                  <div className="text-[11px] text-muted">
                    <span className="font-bold text-foreground">
                      {col.uniqueCount} variasi
                    </span>
                    <div className="text-[10px] text-muted truncate">
                      {col.frequencies.slice(0, 3).map((f) => f.label).join(", ")}
                      {col.frequencies.length > 3 ? "..." : ""}
                    </div>
                  </div>
                )}

                {col.temporalStats && (
                  <div className="text-[11px] text-muted">
                    <span className="font-bold text-foreground">
                      {col.temporalStats.minDate} — {col.temporalStats.maxDate}
                    </span>
                    <div className="text-[10px] text-muted">
                      {col.temporalStats.timePoints.length} hari pencatatan
                    </div>
                  </div>
                )}

                {!col.numericStats && !col.frequencies && !col.temporalStats && (
                  <div className="text-[11px] text-muted truncate">
                    {col.sampleValues.slice(0, 2).join(", ") || "Data teks bebas"}
                  </div>
                )}
              </div>

              {/* Footer: Row Fill Ratio */}
              <div className="pt-2 border-t border-border-subtle flex items-center justify-between text-[10px] font-mono text-muted">
                <span>{col.filledCount} data terisi</span>
                <span>{col.completeness}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </DoubleBezelCard>
  );
}
