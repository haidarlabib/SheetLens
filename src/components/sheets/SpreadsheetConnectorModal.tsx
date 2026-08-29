"use client";

import React, { useState } from "react";
import {
  Table,
  FolderOpen,
  LinkSimple,
  CheckCircle,
  WarningCircle,
  CircleNotch,
  X,
  ArrowRight,
  ArrowSquareOut,
  ArrowsClockwise,
} from "@phosphor-icons/react";
import {
  SpreadsheetDetails,
  SheetTabInfo,
  HeaderDiscoveryResult,
  SheetColumnHeader,
  extractSpreadsheetId,
  ConnectedSpreadsheet,
} from "@/lib/sheets/types";

declare global {
  interface Window {
    gapi?: any;
    google?: any;
  }
}

interface SpreadsheetConnectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnected: (connected: ConnectedSpreadsheet) => void;
  initialSpreadsheetId?: string;
}

type Step = "input" | "tab_select" | "header_preview";

export function SpreadsheetConnectorModal({
  isOpen,
  onClose,
  onConnected,
  initialSpreadsheetId,
}: SpreadsheetConnectorModalProps) {
  const [step, setStep] = useState<Step>(initialSpreadsheetId ? "tab_select" : "input");
  const [inputUrl, setInputUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Loaded spreadsheet details
  const [spreadsheet, setSpreadsheet] = useState<SpreadsheetDetails | null>(null);
  const [selectedTab, setSelectedTab] = useState<SheetTabInfo | null>(null);
  const [headerResult, setHeaderResult] = useState<HeaderDiscoveryResult | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  // Load Google Picker
  const handleOpenGooglePicker = async () => {
    setErrorMessage(null);
    setIsLoading(true);

    try {
      // 1. Fetch token and app credentials from server
      const tokenRes = await fetch("/api/sheets/picker-token");
      if (!tokenRes.ok) {
        throw new Error("Failed to authenticate with Google Drive.");
      }
      const { accessToken, appId, apiKey } = await tokenRes.json();

      // 2. Load gapi client script if not already present
      if (!window.gapi) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://apis.google.com/js/api.js";
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("Failed to load Google API script."));
          document.body.appendChild(script);
        });
      }

      // 3. Load Picker API
      await new Promise<void>((resolve) => {
        window.gapi!.load("picker", () => resolve());
      });

      if (!window.google?.picker) {
        throw new Error("Google Picker is currently unavailable.");
      }

      // 4. Build Picker restricted to spreadsheets
      const docsView = new window.google.picker.DocsView(
        window.google.picker.ViewId.SPREADSHEETS
      )
        .setMimeTypes("application/vnd.google-apps.spreadsheet")
        .setMode(window.google.picker.DocsViewMode.LIST);

      const builder = new window.google.picker.PickerBuilder()
        .addView(docsView)
        .setOAuthToken(accessToken);

      if (apiKey) {
        builder.setDeveloperKey(apiKey);
      }
      if (appId) {
        builder.setAppId(appId);
      }

      builder.setCallback(async (data: any) => {
        if (!data) return;
        const action = data[window.google?.picker?.Response?.ACTION || "action"] || data.action;
        const pickedAction = window.google?.picker?.Action?.PICKED || "picked";

        if (action === pickedAction) {
          const docs = data[window.google?.picker?.Response?.DOCUMENTS || "docs"] || data.docs;
          if (Array.isArray(docs) && docs.length > 0) {
            const pickedFile = docs[0];
            const fileId = pickedFile.id || pickedFile[window.google?.picker?.Document?.ID || "id"];
            if (fileId) {
              await loadSpreadsheetMetadata(fileId);
            }
          }
        }
      });

      const picker = builder.build();
      picker.setVisible(true);
    } catch (err: unknown) {
      console.error("Google Picker initialization error:", err);
      const msg = err instanceof Error ? err.message : "Failed to open Google Drive picker.";
      setErrorMessage(`${msg} You can also paste your Google Sheet link directly below.`);
    } finally {
      setIsLoading(false);
    }
  };

  // Load spreadsheet by ID / URL
  const loadSpreadsheetMetadata = async (idOrUrl: string) => {
    const spreadsheetId = extractSpreadsheetId(idOrUrl);
    if (!spreadsheetId) {
      setErrorMessage("Please enter a valid Google Spreadsheet URL or ID.");
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);

    try {
      const res = await fetch(`/api/sheets/metadata?spreadsheetId=${encodeURIComponent(spreadsheetId)}`);
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to access spreadsheet.");
      }

      setSpreadsheet(json.data);

      // If only 1 sheet exists, pre-select it and discover headers immediately
      if (json.data.sheets && json.data.sheets.length === 1) {
        const firstTab = json.data.sheets[0];
        setSelectedTab(firstTab);
        await loadHeaderDiscovery(json.data.spreadsheetId, firstTab.title);
      } else {
        setStep("tab_select");
      }
    } catch (err: unknown) {
      console.error("Failed to load spreadsheet metadata:", err);
      const msg = err instanceof Error ? err.message : "Unable to access spreadsheet.";
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Discover and validate headers for chosen tab
  const loadHeaderDiscovery = async (spreadsheetId: string, sheetTitle: string) => {
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const res = await fetch(
        `/api/sheets/headers?spreadsheetId=${encodeURIComponent(
          spreadsheetId
        )}&sheetTitle=${encodeURIComponent(sheetTitle)}`
      );
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to read header row.");
      }

      setHeaderResult(json.data);
      setStep("header_preview");
    } catch (err: unknown) {
      console.error("Failed to discover headers:", err);
      const msg = err instanceof Error ? err.message : "Failed to read sheet header row.";
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Tab Selection
  const handleSelectTab = async (tab: SheetTabInfo) => {
    if (!spreadsheet) return;
    setSelectedTab(tab);
    await loadHeaderDiscovery(spreadsheet.spreadsheetId, tab.title);
  };

  // Save connection to session
  const handleConfirmConnection = async () => {
    if (!spreadsheet || !selectedTab || !headerResult) return;

    setIsSaving(true);
    setErrorMessage(null);

    try {
      const payload = {
        spreadsheetId: spreadsheet.spreadsheetId,
        spreadsheetTitle: spreadsheet.title,
        sheetId: selectedTab.sheetId,
        sheetTitle: selectedTab.title,
        headers: headerResult.headers,
        headerCount: headerResult.headerCount,
      };

      const res = await fetch("/api/sheets/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to save spreadsheet connection.");
      }

      onConnected(json.data);
      onClose();
    } catch (err: unknown) {
      console.error("Error confirming connection:", err);
      const msg = err instanceof Error ? err.message : "Failed to confirm spreadsheet connection.";
      setErrorMessage(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="connector-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[var(--surface-muted)] border border-[var(--border)] flex items-center justify-center text-[var(--foreground)]">
              <Table size={15} />
            </div>
            <h2 id="connector-modal-title" className="text-sm font-semibold text-[var(--foreground)]">
              Connect Google Spreadsheet
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-full text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-muted)] transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-left">
          {/* Error Banner */}
          {errorMessage && (
            <div
              role="alert"
              className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-300 text-xs flex items-start gap-2"
            >
              <WarningCircle size={15} className="text-rose-500 shrink-0 mt-0.5" />
              <span className="leading-snug">{errorMessage}</span>
            </div>
          )}

          {/* STEP 1: Input / Select Spreadsheet */}
          {step === "input" && (
            <div className="space-y-4">
              <p className="text-xs text-[var(--muted)] leading-relaxed">
                Choose a Google Sheet from your Drive or paste its sharing link. SheetLens will read its column headers for structured capture.
              </p>

              {/* Option A: Google Drive Picker */}
              <button
                type="button"
                onClick={handleOpenGooglePicker}
                disabled={isLoading}
                className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl bg-[var(--surface-muted)] hover:bg-[var(--border)] border border-[var(--border)] text-[var(--foreground)] transition-all active:scale-[0.99] cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[var(--accent)]">
                    <FolderOpen size={17} />
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-semibold">Browse Google Drive</div>
                    <div className="text-[11px] text-[var(--muted)]">Pick from your Drive files</div>
                  </div>
                </div>
                {isLoading ? (
                  <CircleNotch size={16} className="text-[var(--accent)] animate-spin" />
                ) : (
                  <ArrowRight size={14} className="text-[var(--muted)] group-hover:translate-x-0.5 transition-transform" />
                )}
              </button>

              {/* Divider */}
              <div className="relative flex items-center justify-center">
                <div className="w-full border-t border-[var(--border)]" />
                <span className="absolute px-2.5 bg-[var(--surface)] text-[10.5px] font-mono uppercase text-[var(--muted)] tracking-wider">
                  or paste link
                </span>
              </div>

              {/* Option B: Direct URL / ID Input */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  loadSpreadsheetMetadata(inputUrl);
                }}
                className="space-y-2.5"
              >
                <div className="relative">
                  <input
                    type="text"
                    value={inputUrl}
                    onChange={(e) => setInputUrl(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/..."
                    aria-label="Google Sheets URL or ID"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[var(--surface-inner)] border border-[var(--border)] text-xs text-[var(--foreground)] placeholder:text-[var(--muted)] font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                  />
                  <LinkSimple size={15} className="absolute left-3 top-3 text-[var(--muted)]" />
                </div>

                <button
                  type="submit"
                  disabled={!inputUrl.trim() || isLoading}
                  className="w-full py-2.5 rounded-xl bg-[var(--foreground)] text-[var(--background)] text-xs font-semibold hover:opacity-90 disabled:opacity-40 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {isLoading ? (
                    <CircleNotch size={14} className="animate-spin" />
                  ) : (
                    <span>Inspect Spreadsheet</span>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* STEP 2: Choose Worksheet / Tab */}
          {step === "tab_select" && spreadsheet && (
            <div className="space-y-3.5">
              <div className="p-3 rounded-xl bg-[var(--surface-muted)] border border-[var(--border)]">
                <div className="text-[10px] font-mono uppercase text-[var(--muted)]">Selected Spreadsheet</div>
                <div className="text-xs font-semibold text-[var(--foreground)] truncate mt-0.5">
                  {spreadsheet.title}
                </div>
              </div>

              <div className="text-xs font-medium text-[var(--foreground)]">
                Select target sheet / tab:
              </div>

              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {spreadsheet.sheets.map((sheetTab) => (
                  <button
                    key={sheetTab.sheetId}
                    type="button"
                    onClick={() => handleSelectTab(sheetTab)}
                    disabled={isLoading}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl bg-[var(--surface-inner)] hover:bg-[var(--surface-muted)] border border-[var(--border)] text-xs text-[var(--foreground)] transition-colors cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-2">
                      <Table size={14} className="text-[var(--accent)]" />
                      <span className="font-medium">{sheetTab.title}</span>
                    </div>
                    <span className="text-[10px] font-mono text-[var(--muted)]">
                      {sheetTab.rowCount ? `${sheetTab.rowCount} rows` : "Active"}
                    </span>
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setStep("input")}
                className="text-[11px] font-mono text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
              >
                ← Choose another spreadsheet
              </button>
            </div>
          )}

          {/* STEP 3: Header Discovery Preview & Validation */}
          {step === "header_preview" && spreadsheet && selectedTab && headerResult && (
            <div className="space-y-3.5">
              {/* Spreadsheet & Sheet Summary Card */}
              <div className="p-3 rounded-xl bg-[var(--surface-muted)] border border-[var(--border)] flex items-center justify-between">
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-[var(--foreground)] truncate">
                    {spreadsheet.title}
                  </div>
                  <div className="text-[11px] font-mono text-[var(--accent)] mt-0.5">
                    Tab: {selectedTab.title}
                  </div>
                </div>
                <a
                  href={spreadsheet.spreadsheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--foreground)] border border-[var(--border)]"
                  title="Open in Google Sheets"
                >
                  <ArrowSquareOut size={14} />
                </a>
              </div>

              {/* Header Status & Validation Notice */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[var(--foreground)]">
                  Discovered Columns ({headerResult.headerCount})
                </span>
                {headerResult.hasEmptyHeaders || headerResult.hasDuplicateHeaders ? (
                  <span className="inline-flex items-center gap-1 text-[10.5px] font-mono text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                    <WarningCircle size={12} weight="bold" />
                    <span>Review Warnings</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10.5px] font-mono text-[var(--accent)] bg-[var(--accent-subtle)] px-2 py-0.5 rounded-full border border-[var(--accent-border)]">
                    <CheckCircle size={12} weight="bold" />
                    <span>Schema Valid</span>
                  </span>
                )}
              </div>

              {/* Discovered Column Header Grid */}
              {headerResult.headers.length === 0 ? (
                <div className="p-4 rounded-xl bg-[var(--surface-inner)] border border-dashed border-[var(--border)] text-center text-xs text-[var(--muted)]">
                  No columns found in row 1 of this sheet. Please add header names in your spreadsheet.
                </div>
              ) : (
                <div className="p-2.5 rounded-xl bg-[var(--surface-inner)] border border-[var(--border)] max-h-48 overflow-y-auto space-y-1.5">
                  {headerResult.headers.map((h: SheetColumnHeader) => (
                    <div
                      key={h.index}
                      className={`flex items-center justify-between p-2 rounded-lg text-xs font-mono border ${
                        h.valid
                          ? "bg-[var(--surface)] border-[var(--border)] text-[var(--foreground)]"
                          : "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-300"
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="w-5 h-5 rounded bg-[var(--surface-muted)] text-[var(--muted)] flex items-center justify-center text-[10px] shrink-0 font-bold">
                          {h.letter}
                        </span>
                        <span className="truncate">{h.name}</span>
                      </div>
                      <span className="text-[10px] text-[var(--muted)] shrink-0">
                        {h.valid ? "Ready" : "Invalid"}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Validation Issues Details */}
              {headerResult.validationIssues.length > 0 && (
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-700 dark:text-amber-300 space-y-1">
                  {headerResult.validationIssues.map((issue, i) => (
                    <div key={i} className="flex items-start gap-1.5">
                      <span className="shrink-0">•</span>
                      <span>{issue}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Confirmation Actions */}
              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    spreadsheet.sheets.length > 1 ? setStep("tab_select") : setStep("input")
                  }
                  disabled={isSaving}
                  className="flex-1 py-2.5 rounded-xl bg-[var(--surface-muted)] hover:bg-[var(--border)] border border-[var(--border)] text-xs font-medium text-[var(--foreground)] transition-colors cursor-pointer"
                >
                  Change Tab
                </button>

                <button
                  type="button"
                  onClick={handleConfirmConnection}
                  disabled={headerResult.headerCount === 0 || isSaving}
                  className="flex-2 py-2.5 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-semibold shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {isSaving ? (
                    <CircleNotch size={14} className="animate-spin" />
                  ) : (
                    <>
                      <span>Confirm & Connect</span>
                      <CheckCircle size={14} weight="bold" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
