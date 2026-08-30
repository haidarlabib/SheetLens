"use client";

import React from "react";
import {
  Rows,
  Columns,
  CheckCircle,
  Calendar,
  Tag,
  Hash,
  TextAlignLeft,
  WarningCircle,
} from "@phosphor-icons/react";
import { DatasetProfile } from "@/lib/eda/types";

interface DatasetOverviewCardsProps {
  profile: DatasetProfile;
}

export function DatasetOverviewCards({ profile }: DatasetOverviewCardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-left">
      {/* 1. ROWS */}
      <div className="p-4 rounded-2xl bg-surface border border-border space-y-1">
        <div className="text-[11px] font-mono text-muted uppercase tracking-wider flex items-center justify-between">
          <span>Jumlah Baris</span>
          <Rows size={14} className="text-accent" />
        </div>
        <div className="text-2xl sm:text-3xl font-bold font-mono text-foreground">
          {profile.totalRows.toLocaleString()}
        </div>
        <div className="text-[11px] font-mono text-muted flex items-center gap-1 truncate">
          {profile.duplicateRowCount > 0 ? (
            <span className="text-amber-500 font-medium flex items-center gap-1">
              <WarningCircle size={12} />
              {profile.duplicateRowCount} baris duplikat
            </span>
          ) : (
            <span className="text-emerald-500 font-medium flex items-center gap-1">
              <CheckCircle size={12} />
              Semua baris unik
            </span>
          )}
        </div>
      </div>

      {/* 2. COLUMNS */}
      <div className="p-4 rounded-2xl bg-surface border border-border space-y-1">
        <div className="text-[11px] font-mono text-muted uppercase tracking-wider flex items-center justify-between">
          <span>Jumlah Kolom</span>
          <Columns size={14} className="text-sky-500" />
        </div>
        <div className="text-2xl sm:text-3xl font-bold font-mono text-foreground">
          {profile.totalColumns}
        </div>
        <div className="text-[11px] font-mono text-muted flex items-center gap-1.5 truncate">
          <span>{profile.totalCells.toLocaleString()} kotak data</span>
        </div>
      </div>

      {/* 3. COMPLETENESS */}
      <div className="p-4 rounded-2xl bg-surface border border-border space-y-1">
        <div className="text-[11px] font-mono text-muted uppercase tracking-wider flex items-center justify-between">
          <span>Kelengkapan Data</span>
          <CheckCircle size={14} className="text-emerald-500" />
        </div>
        <div className="text-2xl sm:text-3xl font-bold font-mono text-foreground">
          {profile.overallCompleteness}%
        </div>
        <div className="text-[11px] font-mono text-muted truncate">
          {profile.missingCells > 0 ? (
            <span className="text-amber-500">
              {profile.missingCells.toLocaleString()} sel kosong
            </span>
          ) : (
            <span className="text-emerald-500">100% terisi penuh</span>
          )}
        </div>
      </div>

      {/* 4. DATA TYPES SUMMARY */}
      <div className="p-4 rounded-2xl bg-surface border border-border space-y-1">
        <div className="text-[11px] font-mono text-muted uppercase tracking-wider">
          <span>Isi Kolom</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs font-mono">
          {profile.numericColumns.length > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-accent/10 border border-accent/30 text-accent font-semibold text-[11px]">
              <Hash size={11} />
              {profile.numericColumns.length} Angka
            </span>
          )}
          {profile.temporalColumns.length > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-500 font-semibold text-[11px]">
              <Calendar size={11} />
              {profile.temporalColumns.length} Tanggal
            </span>
          )}
          {profile.categoricalColumns.length > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-500 font-semibold text-[11px]">
              <Tag size={11} />
              {profile.categoricalColumns.length} Kategori
            </span>
          )}
          {profile.textColumns.length > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-surface-muted border border-border text-muted font-semibold text-[11px]">
              <TextAlignLeft size={11} />
              {profile.textColumns.length} Teks
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
