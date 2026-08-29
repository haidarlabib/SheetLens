"use client";

import React, { useEffect, useState } from "react";

interface LdrsLoaderProps {
  variant?: "quantum" | "hourglass";
  size?: number | string;
  color?: string;
  speed?: number | string;
  bgOpacity?: number | string;
  className?: string;
  label?: string;
}

let isRegistered = false;

export function LdrsLoader({
  variant = "quantum",
  size = 32,
  color,
  speed = 1.75,
  bgOpacity = 0.1,
  className = "",
  label = "Loading...",
}: LdrsLoaderProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    async function initLdrs() {
      if (!isRegistered && typeof window !== "undefined") {
        try {
          const { quantum, hourglass } = await import("ldrs");
          quantum.register();
          hourglass.register();
          isRegistered = true;
        } catch (err) {
          console.error("Failed to register ldrs loaders:", err);
        }
      }
      setMounted(true);
    }
    initLdrs();
  }, []);

  if (!mounted) {
    return (
      <div
        role="status"
        aria-live="polite"
        aria-busy="true"
        aria-label={label}
        className={`inline-flex items-center justify-center ${className}`}
        style={{ width: size, height: size }}
      >
        <span className="sr-only">{label}</span>
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={label}
      className={`inline-flex items-center justify-center ${className}`}
    >
      {variant === "quantum" ? (
        <l-quantum
          size={size}
          speed={speed}
          color={color || "var(--accent)"}
        />
      ) : (
        <l-hourglass
          size={size}
          speed={speed}
          color={color || "var(--accent)"}
          bg-opacity={bgOpacity}
        />
      )}
      <span className="sr-only">{label}</span>
    </div>
  );
}
