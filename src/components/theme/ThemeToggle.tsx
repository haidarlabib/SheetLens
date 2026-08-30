"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useTheme } from "./ThemeProvider";
import { Sun, Moon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { resolvedTheme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  const pressTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setMounted(true);
    return () => {
      if (pressTimeoutRef.current) clearTimeout(pressTimeoutRef.current);
      if (transitionTimeoutRef.current) clearTimeout(transitionTimeoutRef.current);
    };
  }, []);

  const isDark = mounted ? resolvedTheme === "dark" : false;
  const label = isDark ? "Beralih ke mode terang" : "Beralih ke mode gelap";

  const handleToggle = useCallback(() => {
    // Clear any existing timeouts for rapid click safety
    if (pressTimeoutRef.current) clearTimeout(pressTimeoutRef.current);
    if (transitionTimeoutRef.current) clearTimeout(transitionTimeoutRef.current);

    setIsPressed(true);
    setIsTransitioning(true);

    toggleTheme();

    // Step 1: Release the compression into a subtle spring bloom (120ms)
    pressTimeoutRef.current = setTimeout(() => {
      setIsPressed(false);
    }, 120);

    // Step 2: Settle the glow and scale back to clean resting state (400ms)
    transitionTimeoutRef.current = setTimeout(() => {
      setIsTransitioning(false);
    }, 400);
  }, [toggleTheme]);

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label={label}
      title={label}
      className={cn(
        // Accessible 44px touch target container
        "relative inline-flex items-center justify-center min-w-[44px] min-h-[44px] p-1.5 rounded-xl group focus-visible:outline-none cursor-pointer select-none",
        className
      )}
    >
      {/* Physical Hardware Toggle Container (Compact 32px) */}
      <div
        className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center relative overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none",
          "bg-surface-muted hover:bg-surface-inner border border-border",
          "group-focus-visible:ring-2 group-focus-visible:ring-accent group-focus-visible:ring-offset-1 group-focus-visible:ring-offset-background",
          // Tactile Scale Sequence: normal -> pressed (0.92) -> spring bloom (1.04) -> settle (1.0)
          isPressed
            ? "scale-[0.92]"
            : isTransitioning
            ? "scale-[1.04]"
            : "scale-100 active:scale-[0.94]",
          // Soft Light Glow Bloom: amber for light switch, emerald for dark switch
          isTransitioning
            ? isDark
              ? "shadow-[0_0_16px_2px_rgba(16,185,129,0.30)] border-emerald-500/40"
              : "shadow-[0_0_16px_2px_rgba(245,158,11,0.30)] border-amber-500/40"
            : "shadow-2xs"
        )}
      >
        {/* Soft Ambient Internal Radial Gradient on Transition */}
        <div
          className={cn(
            "absolute inset-0 rounded-lg pointer-events-none transition-opacity duration-300 ease-out",
            isTransitioning ? "opacity-100" : "opacity-0",
            isDark
              ? "bg-gradient-to-tr from-emerald-500/15 via-emerald-400/5 to-transparent"
              : "bg-gradient-to-tr from-amber-500/15 via-amber-400/5 to-transparent"
          )}
        />

        {/* 1. SUN ICON (Light Mode) - Two-Stage Morph & Color Transition */}
        <Sun
          size={16}
          weight="bold"
          className={cn(
            "absolute transition-all duration-380 ease-[cubic-bezier(0.34,1.56,0.64,1)] motion-reduce:transition-none",
            isDark
              ? // Phase 1 & 2: Rays contract, twist clockwise and collapse with fading amber
                "rotate-90 scale-0 opacity-0 text-amber-500/10 pointer-events-none"
              : // Uncurling and blooming outwards into vibrant warm sun gold
                "rotate-0 scale-100 opacity-100 text-amber-500 dark:text-muted"
          )}
        />

        {/* 2. MOON ICON (Dark Mode) - Two-Stage Morph & Color Transition */}
        <Moon
          size={15}
          weight="fill"
          className={cn(
            "absolute transition-all duration-380 ease-[cubic-bezier(0.34,1.56,0.64,1)] motion-reduce:transition-none",
            isDark
              ? // Emerging from eclipse center, expanding into crisp celestial emerald
                "rotate-0 scale-100 opacity-100 text-emerald-400"
              : // Phase 1 & 2: Crescent twists counter-clockwise and gathers inward
                "-rotate-90 scale-0 opacity-0 text-emerald-400/10 pointer-events-none"
          )}
        />
      </div>

      <span className="sr-only">{label}</span>
    </button>
  );
}
