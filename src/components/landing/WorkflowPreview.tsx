import React from "react";
import { ArrowRight, ArrowDown } from "@phosphor-icons/react/dist/ssr";

export function WorkflowPreview() {
  return (
    <div className="w-full rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-3.5 sm:p-5 shadow-[var(--card-shadow)] transition-colors duration-200">
      {/* Workflow Step Pipeline */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 sm:gap-2 items-center">
        {/* Step 1: Document */}
        <div className="rounded-xl bg-[var(--surface-inner)] border border-[var(--border)] p-3 sm:p-3.5 flex flex-col justify-between h-full">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted)]">
              01 · Physical Doc
            </span>
            <span className="text-[10px] font-mono text-[var(--muted)] bg-[var(--surface-muted)] px-1.5 py-0.5 rounded border border-[var(--border)]">
              CAPTURE
            </span>
          </div>
          <div className="space-y-1.5 py-1">
            <div className="text-xs font-semibold text-[var(--foreground)] truncate">
              Apex Logistics Inc.
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono text-[var(--muted)]">
              <span>INV-8820</span>
              <span className="text-[var(--foreground)] font-medium">$1,250.00</span>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-[10px] font-mono text-[var(--muted)]">
            <span>Aug 29, 2026</span>
            <span className="text-[var(--accent)]">Captured</span>
          </div>
        </div>

        {/* Pipeline Arrow */}
        <div className="hidden md:flex justify-center -mx-2 z-10">
          <div className="w-6 h-6 rounded-full bg-[var(--surface-muted)] border border-[var(--border)] flex items-center justify-center text-[var(--muted)]">
            <ArrowRight size={11} />
          </div>
        </div>
        <div className="flex md:hidden justify-center my-0.5">
          <ArrowDown size={13} className="text-[var(--muted)]" />
        </div>

        {/* Step 2: Schema Extraction */}
        <div className="rounded-xl bg-[var(--surface-inner)] border border-[var(--accent-border)] p-3 sm:p-3.5 flex flex-col justify-between h-full">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--accent)]">
              02 · Field Parser
            </span>
            <span className="text-[10px] font-mono text-[var(--accent)] bg-[var(--accent-subtle)] px-1.5 py-0.5 rounded border border-[var(--accent-border)]">
              PARSED
            </span>
          </div>
          <div className="space-y-1 py-1 font-mono text-[11px]">
            <div className="flex justify-between">
              <span className="text-[var(--muted)]">vendor:</span>
              <span className="text-[var(--foreground)] font-medium truncate max-w-[100px]">Apex Log.</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted)]">total:</span>
              <span className="text-[var(--accent)] font-medium">1250.00</span>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-[var(--border-subtle)] text-[10px] font-mono text-[var(--accent)] flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] shrink-0" />
            <span>Schema aligned</span>
          </div>
        </div>

        {/* Pipeline Arrow */}
        <div className="hidden md:flex justify-center -mx-2 z-10">
          <div className="w-6 h-6 rounded-full bg-[var(--surface-muted)] border border-[var(--border)] flex items-center justify-center text-[var(--muted)]">
            <ArrowRight size={11} />
          </div>
        </div>
        <div className="flex md:hidden justify-center my-0.5">
          <ArrowDown size={13} className="text-[var(--muted)]" />
        </div>

        {/* Step 3: Google Sheets Row */}
        <div className="rounded-xl bg-[var(--surface-inner)] border border-[var(--border)] p-3 sm:p-3.5 flex flex-col justify-between h-full">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted)]">
              03 · Cloud Sheet
            </span>
            <span className="text-[10px] font-mono text-[var(--muted)] bg-[var(--surface-muted)] px-1.5 py-0.5 rounded border border-[var(--border)]">
              SYNCED
            </span>
          </div>
          <div className="rounded border border-[var(--border)] overflow-hidden text-[10px] font-mono">
            <div className="grid grid-cols-3 bg-[var(--surface-muted)] text-[var(--muted)] border-b border-[var(--border)] px-1.5 py-0.5 font-medium">
              <span>Date</span>
              <span>Vendor</span>
              <span className="text-right">Total</span>
            </div>
            <div className="grid grid-cols-3 px-1.5 py-1 text-[var(--foreground)] bg-[var(--accent-subtle)]">
              <span className="truncate">08/29</span>
              <span className="truncate">Apex</span>
              <span className="text-right text-[var(--accent)] font-medium">$1,250</span>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-[var(--border-subtle)] text-[10px] font-mono text-[var(--muted)]">
            <span>Appended to Row #42</span>
          </div>
        </div>
      </div>
    </div>
  );
}
