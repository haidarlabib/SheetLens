"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  House,
  Table,
  Camera,
  ChartBar,
  SignOut,
} from "@phosphor-icons/react";
import { SessionUser } from "@/lib/auth/session";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { BrandMark } from "@/components/ui/BrandMark";

interface AppShellProps {
  children: React.ReactNode;
  user: SessionUser;
  activeSpreadsheetTitle?: string | null;
}

export function AppShell({
  children,
  user,
  activeSpreadsheetTitle,
}: AppShellProps) {
  const pathname = usePathname();

  const navItems = [
    { href: "/home", label: "Home", icon: House },
    { href: "/sheets", label: "Sheets", icon: Table },
    { href: "/scan", label: "Scan", icon: Camera },
    { href: "/analysis", label: "Analysis", icon: ChartBar },
  ];

  return (
    <div className="relative min-h-[100dvh] flex flex-col justify-between overflow-x-hidden bg-background text-foreground transition-colors duration-200">
      {/* DESKTOP / TABLET TOP NAVIGATION BAR */}
      <header className="sticky top-0 z-40 w-full border-b border-border bg-surface/85 backdrop-blur-xl transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
          {/* Left: Brand Identity & Active Dataset Pill */}
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/home"
              className="flex items-center gap-2.5 group focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent rounded-lg shrink-0"
            >
              <BrandMark size={22} />
              <span className="font-bold tracking-tight text-foreground text-sm font-sans">
                SheetLens
              </span>
            </Link>

            {activeSpreadsheetTitle && (
              <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-mono text-muted bg-surface-muted px-2.5 py-0.5 rounded-full border border-border truncate max-w-[200px] lg:max-w-[280px]">
                <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0 animate-pulse" />
                <span className="truncate">{activeSpreadsheetTitle}</span>
              </div>
            )}
          </div>

          {/* Center: Desktop Navigation Segmented Pill */}
          <nav className="hidden md:flex items-center gap-1 bg-surface-inner p-1 rounded-full border border-border">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                    isActive
                      ? "bg-surface text-foreground shadow-2xs font-semibold"
                      : "text-muted hover:text-foreground hover:bg-surface/50"
                  }`}
                >
                  <Icon
                    size={15}
                    weight={isActive ? "bold" : "regular"}
                    className={isActive ? "text-accent" : ""}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right: Theme Toggle & User Profile Controls */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <ThemeToggle />

            <div className="flex items-center gap-2 pl-1 border-l border-border">
              {user.picture ? (
                <Image
                  src={user.picture}
                  alt={user.name || "User Avatar"}
                  width={28}
                  height={28}
                  className="rounded-full ring-1 ring-border shrink-0 object-cover"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-surface-muted border border-border flex items-center justify-center text-xs font-semibold text-foreground">
                  {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                </div>
              )}

              <form action="/api/auth/logout" method="POST">
                <button
                  type="submit"
                  title="Sign Out"
                  aria-label="Sign Out of Session"
                  className="p-1.5 rounded-lg text-muted hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                >
                  <SignOut size={16} />
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT CANVAS */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-24 md:pb-12">
        {children}
      </main>

      {/* AUTHENTICATED DESKTOP FOOTER */}
      <footer className="hidden md:flex w-full max-w-7xl mx-auto px-6 lg:px-8 py-4 border-t border-border items-center justify-between text-[11px] font-mono text-muted">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-accent" />
          <span>SheetLens · Visual Data Instrument</span>
        </div>
        <span className="text-muted/80">Made by Izza</span>
      </footer>

      {/* MOBILE FIXED BOTTOM NAVIGATION BAR (< 768px) */}
      <nav
        aria-label="Mobile navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface/90 backdrop-blur-2xl border-t border-border px-2 py-1.5 flex items-center justify-around pb-safe shadow-lg"
      >
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center justify-center py-1.5 px-2 rounded-xl min-h-[48px] transition-colors focus-visible:outline-none ${
                isActive
                  ? "text-foreground font-semibold"
                  : "text-muted hover:text-foreground"
              }`}
            >
              <Icon
                size={20}
                weight={isActive ? "fill" : "regular"}
                className={`transition-colors ${
                  isActive ? "text-accent" : "text-muted"
                }`}
              />
              <span
                className={`text-[10px] font-mono mt-1 tracking-tight transition-colors ${
                  isActive ? "text-foreground font-bold" : "text-muted"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
