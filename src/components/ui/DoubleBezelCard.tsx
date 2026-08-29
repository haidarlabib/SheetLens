import React from "react";
import { cn } from "@/lib/utils";

interface DoubleBezelCardProps {
  children: React.ReactNode;
  className?: string;
  innerClassName?: string;
  glow?: boolean;
}

export function DoubleBezelCard({
  children,
  className,
  innerClassName,
  glow = false,
}: DoubleBezelCardProps) {
  return (
    <div
      className={cn(
        "relative rounded-3xl p-[3px] transition-all duration-300",
        "bg-[var(--surface-muted)] border border-[var(--border)]",
        "shadow-[var(--card-shadow)]",
        glow && "shadow-[var(--card-glow)] border-[var(--accent-border)]",
        className
      )}
    >
      <div
        className={cn(
          "h-full w-full rounded-[calc(1.5rem-3px)] bg-[var(--surface)] p-5 sm:p-6",
          "border border-[var(--border-subtle)]",
          "transition-colors duration-200",
          innerClassName
        )}
      >
        {children}
      </div>
    </div>
  );
}
