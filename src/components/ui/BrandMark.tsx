import React from "react";
import { cn } from "@/lib/utils";

interface BrandMarkProps {
  size?: number;
  className?: string;
}

export function BrandMark({ size = 20, className }: BrandMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      aria-hidden="true"
    >
      {/* Outer Document / Scanner Brackets */}
      <path
        d="M4 8.5V5C4 4.44772 4.44772 4 5 4H8.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path
        d="M15.5 4H19C19.5523 4 20 4.44772 20 5V8.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path
        d="M4 15.5V19C4 19.5523 4.44772 20 5 20H8.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path
        d="M15.5 20H19C19.5523 20 20 19.5523 20 19V15.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />

      {/* Internal Spreadsheet Grid Core */}
      <rect
        x="7.5"
        y="7.5"
        width="9"
        height="9"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <line
        x1="7.5"
        y1="12"
        x2="16.5"
        y2="12"
        stroke="currentColor"
        strokeWidth="1.25"
      />
      <line
        x1="12"
        y1="7.5"
        x2="12"
        y2="16.5"
        stroke="currentColor"
        strokeWidth="1.25"
      />

      {/* Active Emerald Sync Cell */}
      <rect
        x="12"
        y="12"
        width="4.5"
        height="4.5"
        rx="0.75"
        fill="var(--accent)"
      />
    </svg>
  );
}
