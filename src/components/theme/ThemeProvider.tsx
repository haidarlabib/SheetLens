"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: "light" | "dark") => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("dark");
  const [mounted, setMounted] = useState(false);

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

  const toggleTheme = useCallback(() => {
    const currentActive = document.documentElement.classList.contains("dark") ? "dark" : "light";
    const nextTheme: "light" | "dark" = currentActive === "dark" ? "light" : "dark";

    setThemeState(nextTheme);
    setResolvedTheme(nextTheme);
    applyThemeToDOM(nextTheme);
    try {
      localStorage.setItem("sheetlens_theme", nextTheme);
    } catch {}
  }, [applyThemeToDOM]);

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
      value={{ theme, resolvedTheme, setTheme, toggleTheme }}
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
