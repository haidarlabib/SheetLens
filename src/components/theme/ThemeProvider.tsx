"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";

type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  isTransitioning: boolean;
  setTheme: (theme: "light" | "dark") => void;
  toggleTheme: (coords?: { clientX: number; clientY: number }) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("dark");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [mounted, setMounted] = useState(false);
  const isTransitioningRef = useRef(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("sheetlens_theme") as Theme | null;
      if (stored && ["light", "dark"].includes(stored)) {
        setThemeState(stored);
        setResolvedTheme(stored as "light" | "dark");
      } else {
        const isDark = document.documentElement.classList.contains("dark");
        setResolvedTheme(isDark ? "dark" : "light");
      }
    } catch {
      // localStorage unavailable (e.g. private mode)
    }
    setMounted(true);
  }, []);

  const applyThemeToDOM = useCallback((newTheme: "light" | "dark") => {
    const root = document.documentElement;
    if (newTheme === "dark") {
      root.classList.add("dark");
      root.style.colorScheme = "dark";
    } else {
      root.classList.remove("dark");
      root.style.colorScheme = "light";
    }
  }, []);

  const setTheme = useCallback(
    (newTheme: "light" | "dark") => {
      setThemeState(newTheme);
      setResolvedTheme(newTheme);
      applyThemeToDOM(newTheme);
      try {
        localStorage.setItem("sheetlens_theme", newTheme);
      } catch {
        // localStorage write error fallback
      }
    },
    [applyThemeToDOM]
  );

  const toggleTheme = useCallback(
    (coords?: { clientX: number; clientY: number }) => {
      // Interaction Lock: Prevent rapid double-toggle during active takeover
      if (isTransitioningRef.current) return;

      const currentActive = document.documentElement.classList.contains("dark") ? "dark" : "light";
      const nextTheme: "light" | "dark" = currentActive === "dark" ? "light" : "dark";

      const isReducedMotion =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      // When reduced motion is preferred: instantaneous theme switch
      if (isReducedMotion || typeof window === "undefined" || typeof document === "undefined") {
        setTheme(nextTheme);
        return;
      }

      // Physics-Calibrated Theme Takeover Expansion
      isTransitioningRef.current = true;
      setIsTransitioning(true);

      const originX = coords?.clientX ?? window.innerWidth / 2;
      const originY = coords?.clientY ?? window.innerHeight / 2;

      // Calculate maximum radius to furthest viewport corner + safety buffer
      const maxRadius =
        Math.ceil(
          Math.hypot(
            Math.max(originX, window.innerWidth - originX),
            Math.max(originY, window.innerHeight - originY)
          )
        ) + 40;

      const targetBg = nextTheme === "dark" ? "#0B0D0C" : "#F7F8F6";

      // Create high-priority full-screen GPU takeover overlay
      const overlay = document.createElement("div");
      overlay.setAttribute("aria-hidden", "true");
      overlay.style.position = "fixed";
      overlay.style.inset = "0";
      overlay.style.zIndex = "999999";
      overlay.style.pointerEvents = "none";
      overlay.style.backgroundColor = targetBg;
      overlay.style.willChange = "clip-path";
      overlay.style.clipPath = `circle(0px at ${originX}px ${originY}px)`;
      document.body.appendChild(overlay);

      // Expanding wave animation (540ms total duration with custom power-out curve)
      const animation = overlay.animate(
        [
          { clipPath: `circle(0px at ${originX}px ${originY}px)` },
          { clipPath: `circle(${maxRadius}px at ${originX}px ${originY}px)` },
        ],
        {
          duration: 540,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
          fill: "forwards",
        }
      );

      // Flip DOM semantic tokens halfway through while the wave covers the screen
      const switchTimer = setTimeout(() => {
        applyThemeToDOM(nextTheme);
        setThemeState(nextTheme);
        setResolvedTheme(nextTheme);
        try {
          localStorage.setItem("sheetlens_theme", nextTheme);
        } catch {}
      }, 280);

      animation.onfinish = () => {
        clearTimeout(switchTimer);
        applyThemeToDOM(nextTheme);
        setThemeState(nextTheme);
        setResolvedTheme(nextTheme);
        try {
          localStorage.setItem("sheetlens_theme", nextTheme);
        } catch {}

        // Seamless 70ms micro-fade out before unmounting
        const fadeAnim = overlay.animate([{ opacity: 1 }, { opacity: 0 }], {
          duration: 70,
          easing: "ease-out",
          fill: "forwards",
        });

        fadeAnim.onfinish = () => {
          overlay.remove();
          isTransitioningRef.current = false;
          setIsTransitioning(false);
        };
      };
    },
    [applyThemeToDOM, setTheme]
  );

  // System listener active only if user has not explicitly set a preference
  useEffect(() => {
    if (!mounted) return;
    if (theme !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleMediaChange = (e: MediaQueryListEvent) => {
      const active = e.matches ? "dark" : "light";
      setResolvedTheme(active);
      applyThemeToDOM(active);
    };

    mediaQuery.addEventListener("change", handleMediaChange);
    return () => mediaQuery.removeEventListener("change", handleMediaChange);
  }, [mounted, theme, applyThemeToDOM]);

  return (
    <ThemeContext.Provider
      value={{ theme, resolvedTheme, isTransitioning, setTheme, toggleTheme }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
