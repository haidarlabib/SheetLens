"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { SignOut, ShieldCheck } from "@phosphor-icons/react";
import { SessionUser } from "@/lib/auth/session";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { BrandMark } from "@/components/ui/BrandMark";

interface NavbarProps {
  user?: SessionUser | null;
}

export function Navbar({ user }: NavbarProps) {
  return (
    <header className="sticky top-3 sm:top-5 z-40 w-full px-3 sm:px-4 flex justify-center pointer-events-none">
      <nav className="pointer-events-auto flex items-center justify-between gap-3 px-3 sm:px-4 py-2 rounded-full bg-[var(--surface)]/90 backdrop-blur-xl border border-[var(--border)] shadow-[0_4px_24px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] w-full max-w-2xl transition-colors duration-200">
        {/* Brand Identity */}
        <Link
          href="/"
          className="flex items-center gap-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] rounded-full p-0.5"
        >
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[var(--surface-muted)] border border-[var(--border)] flex items-center justify-center text-[var(--foreground)] transition-transform duration-200 group-hover:scale-105">
            <BrandMark size={16} />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold tracking-tight text-[var(--foreground)] text-sm">
                SheetLens
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
            </div>
            <span className="text-[10px] text-[var(--muted)] font-mono tracking-tight hidden xs:inline">
              Document to Sheets
            </span>
          </div>
        </Link>

        {/* Right Section: Theme Toggle + Auth Status */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          <ThemeToggle />

          {user ? (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="hidden md:flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[var(--accent-subtle)] border border-[var(--accent-border)] text-[var(--accent)] text-[11px] font-mono">
                <ShieldCheck size={13} weight="bold" />
                <span>Connected</span>
              </div>

              <div className="flex items-center gap-1.5 pl-0.5">
                {user.picture ? (
                  <Image
                    src={user.picture}
                    alt={user.name || "Google Avatar"}
                    width={26}
                    height={26}
                    className="rounded-full ring-1 ring-[var(--border)] shrink-0"
                  />
                ) : (
                  <div className="w-6.5 h-6.5 rounded-full bg-[var(--surface-muted)] border border-[var(--border)] flex items-center justify-center text-xs font-semibold text-[var(--foreground)]">
                    {user.name?.charAt(0) || "U"}
                  </div>
                )}
                <span className="text-xs font-medium text-[var(--foreground)] hidden lg:inline max-w-[100px] truncate">
                  {user.name}
                </span>
              </div>

              <form action="/api/auth/logout" method="POST">
                <button
                  type="submit"
                  title="Sign Out"
                  aria-label="Sign Out"
                  className="p-1.5 rounded-full text-[var(--muted)] hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                >
                  <SignOut size={16} />
                </button>
              </form>
            </div>
          ) : (
            <a
              href="/api/auth/google/login"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--surface-muted)] hover:bg-[var(--border)] border border-[var(--border)] text-xs font-medium text-[var(--foreground)] transition-all active:scale-[0.98]"
            >
              <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Sign In</span>
            </a>
          )}
        </div>
      </nav>
    </header>
  );
}
