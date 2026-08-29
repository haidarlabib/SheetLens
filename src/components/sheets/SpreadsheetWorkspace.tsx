"use client";

import React, { useState } from "react";
import {
  Table,
  Camera,
  Sparkle,
  FilePlus,
  FolderOpen,
  ArrowRight,
  Plus,
} from "@phosphor-icons/react";
import { ConnectedSpreadsheet } from "@/lib/sheets/types";
import { DoubleBezelCard } from "@/components/ui/DoubleBezelCard";
import { ConnectedSpreadsheetCard } from "./ConnectedSpreadsheetCard";
import { SpreadsheetConnectorModal } from "./SpreadsheetConnectorModal";
import { CreateSpreadsheetModal } from "./CreateSpreadsheetModal";
import { DocumentCaptureModal } from "@/components/capture/DocumentCaptureModal";

interface SpreadsheetWorkspaceProps {
  initialConnectedSheet?: ConnectedSpreadsheet | null;
}

export function SpreadsheetWorkspace({
  initialConnectedSheet,
}: SpreadsheetWorkspaceProps) {
  const [connectedSheet, setConnectedSheet] = useState<ConnectedSpreadsheet | null>(
    initialConnectedSheet || null
  );
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCaptureModalOpen, setIsCaptureModalOpen] = useState(false);

  return (
    <div className="w-full space-y-4">
      {connectedSheet ? (
        <>
          {/* Primary Action Card: Scan Document */}
          <DoubleBezelCard glow className="bg-gradient-to-b from-[var(--surface)] to-[var(--surface-muted)]">
            <div className="flex items-center justify-between border-b border-border pb-3 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-accent-subtle border border-accent-border flex items-center justify-center text-accent">
                  <Camera size={16} weight="bold" />
                </div>
                <h2 className="text-xs font-semibold text-foreground">
                  Document Capture
                </h2>
              </div>
              <span className="text-[10px] font-mono text-accent bg-accent-subtle px-2 py-0.5 rounded-full border border-accent-border">
                Ready to Scan
              </span>
            </div>

            <p className="text-xs text-muted leading-relaxed mb-3.5">
              Photograph receipts, invoices, or delivery bills. SheetLens uses Gemini Vision to map extracted data to your{" "}
              <span className="text-foreground font-semibold font-mono">
                {connectedSheet.headers.length} spreadsheet columns
              </span>
              .
            </p>

            <button
              type="button"
              onClick={() => setIsCaptureModalOpen(true)}
              className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-foreground text-background hover:opacity-90 active:scale-[0.98] text-xs font-semibold shadow-md transition-all cursor-pointer group"
            >
              <Camera size={17} weight="bold" className="text-accent group-hover:scale-110 transition-transform" />
              <span>Scan / Capture Document</span>
              <Sparkle size={14} weight="fill" className="text-accent" />
            </button>
          </DoubleBezelCard>

          {/* Active Connected Spreadsheet Details */}
          <ConnectedSpreadsheetCard
            spreadsheet={connectedSheet}
            onChangeSpreadsheet={() => setIsConnectModalOpen(true)}
            onDisconnect={() => setConnectedSheet(null)}
            onUpdateHeaders={(updated) => setConnectedSheet(updated)}
          />

          {/* Create New Sheet Quick Action */}
          <div className="text-center pt-1">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-1.5 text-xs font-mono text-muted hover:text-foreground transition-colors cursor-pointer"
            >
              <Plus size={13} />
              <span>Create Another Spreadsheet</span>
            </button>
          </div>
        </>
      ) : (
        /* Where Should Your Data Go? — Onboarding Setup Card */
        <DoubleBezelCard className="border-dashed">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-surface-muted border border-border flex items-center justify-center text-accent">
                <Table size={16} />
              </div>
              <h2 className="text-sm font-semibold text-foreground">
                Where should your data go?
              </h2>
            </div>
            <span className="text-[10px] font-mono text-muted bg-surface-muted px-2 py-0.5 rounded-full border border-border">
              Setup
            </span>
          </div>

          <p className="text-xs text-muted leading-relaxed mb-4">
            Create a new sheet or connect one you already use.
          </p>

          <div className="space-y-2.5">
            {/* Option 1: Create New Spreadsheet (Primary / Recommended) */}
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl bg-foreground text-background hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer shadow-sm group"
            >
              <div className="flex items-center gap-3 text-left min-w-0">
                <div className="w-8 h-8 rounded-xl bg-background/15 flex items-center justify-center text-background shrink-0">
                  <FilePlus size={18} weight="bold" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold flex items-center gap-1.5">
                    <span>Create New Spreadsheet</span>
                    <span className="text-[9px] font-mono uppercase text-accent bg-accent-subtle px-1.5 py-0.2 rounded border border-accent-border font-bold">
                      Recommended
                    </span>
                  </div>
                  <div className="text-[11px] opacity-75 truncate">
                    Define your columns & create in Drive
                  </div>
                </div>
              </div>
              <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform shrink-0 ml-2" />
            </button>

            {/* Option 2: Connect Existing Spreadsheet */}
            <button
              type="button"
              onClick={() => setIsConnectModalOpen(true)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-surface-muted hover:bg-border border border-border text-foreground transition-all active:scale-[0.98] cursor-pointer group"
            >
              <div className="flex items-center gap-3 text-left min-w-0">
                <div className="w-8 h-8 rounded-xl bg-surface border border-border flex items-center justify-center text-muted group-hover:text-foreground shrink-0">
                  <FolderOpen size={17} />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-medium">Connect Existing Spreadsheet</div>
                  <div className="text-[11px] text-muted truncate">
                    Select via Google Picker or paste link
                  </div>
                </div>
              </div>
              <ArrowRight size={14} className="text-muted group-hover:text-foreground group-hover:translate-x-0.5 transition-transform shrink-0 ml-2" />
            </button>
          </div>
        </DoubleBezelCard>
      )}

      {/* Progressive Connect Existing Spreadsheet Modal */}
      <SpreadsheetConnectorModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
        onConnected={(sheet) => setConnectedSheet(sheet)}
      />

      {/* Create New Spreadsheet & Dynamic Schema Builder Modal */}
      <CreateSpreadsheetModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={(sheet) => setConnectedSheet(sheet)}
      />

      {/* Document Capture & Extraction Modal */}
      <DocumentCaptureModal
        isOpen={isCaptureModalOpen}
        onClose={() => setIsCaptureModalOpen(false)}
        targetSheetTitle={connectedSheet?.sheetTitle}
      />
    </div>
  );
}
