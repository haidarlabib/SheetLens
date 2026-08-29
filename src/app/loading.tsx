import React from "react";
import { LdrsLoader } from "@/components/ui/LdrsLoader";

export default function Loading() {
  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-background text-foreground px-4 text-center">
      <div className="relative rounded-3xl p-[3px] bg-surface-muted border border-border shadow-[var(--card-shadow)] max-w-xs w-full">
        <div className="rounded-[calc(1.5rem-3px)] bg-surface p-6 border border-border-subtle flex flex-col items-center gap-4">
          <LdrsLoader variant="hourglass" size={38} label="Loading session..." />
          <div>
            <div className="text-sm font-semibold text-foreground font-sans">
              Loading Workspace
            </div>
            <div className="text-xs text-muted font-mono mt-1">
              Resolving secure session
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
