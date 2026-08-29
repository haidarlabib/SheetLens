"use client";

import React, { useEffect, useState, useRef } from "react";
import { useTheme } from "./ThemeProvider";
import { Sun, Moon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { resolvedTheme, isTransitioning, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted ? resolvedTheme === "dark" : false;
  const label = isDark ? "Switch to light mode" : "Switch to dark mode";

  const handleToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (isTransitioning) return;

    // Get exact physical center of the button for radial takeover origin
    const rect = buttonRef.current?.getBoundingClientRect();
    const clientX = rect ? rect.left + rect.width / 2 : e.clientX;
    const clientY = rect ? rect.top + rect.height / 2 : e.clientY;

    toggleTheme({ clientX, clientY });
  };

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={handleToggle}
      disabled={isTransitioning}
      aria-label={label}
      title={label}
      className={cn(
        // Accessible 44px touch target container
        "relative inline-flex items-center justify-center min-w-[44px] min-h-[44px] p-1.5 rounded-xl group focus-visible:outline-none",
        isTransitioning ? "cursor-default" : "cursor-pointer",
        className
      )}
    >
      {/* Physical Hardware Toggle Container (Compact 32px) */}
      <div
        className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center relative overflow-hidden transition-all duration-200",
          "bg-surface-muted hover:bg-surface-inner border border-border text-muted group-hover:text-foreground",
          "shadow-2xs active:scale-90",
          "group-focus-visible:ring-2 group-focus-visible:ring-accent group-focus-visible:ring-offset-1 group-focus-visible:ring-offset-background"
        )}
      >
        {/* Sun Icon (Light Mode Active) */}
        <Sun
          size={16}
          weight="bold"
          className={cn(
            "absolute text-amber-500/90 dark:text-muted transition-all duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
            isDark
              ? "rotate-45 scale-0 opacity-0 pointer-events-none"
              : "rotate-0 scale-100 opacity-100"
          )}
        />

        {/* Moon Icon (Dark Mode Active) */}
        <Moon
          size={15}
          weight="fill"
          className={cn(
            "absolute text-emerald-400 dark:text-emerald-400 transition-all duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
            isDark
              ? "rotate-0 scale-100 opacity-100"
              : "-rotate-45 scale-0 opacity-0 pointer-events-none"
          )}
        />
      </div>

      <span className="sr-only">{label}</span>
    </button>
  );
}
