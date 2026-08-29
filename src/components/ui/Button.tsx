"use client";

import React from "react";
import { motion, HTMLMotionProps } from "motion/react";
import { cn } from "@/lib/utils";

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "google" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  icon,
  trailingIcon,
  fullWidth = false,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const sizeClasses = {
    sm: "px-4 py-2 text-xs gap-2",
    md: "px-5 py-2.5 text-sm gap-3",
    lg: "px-7 py-3.5 text-base gap-3.5",
  };

  const variantClasses = {
    primary:
      "bg-emerald-500 hover:bg-emerald-400 text-black font-semibold shadow-[0_0_24px_rgba(16,185,129,0.25)] border border-emerald-400/30",
    secondary:
      "bg-white/[0.06] hover:bg-white/[0.1] text-neutral-200 border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]",
    google:
      "bg-white text-neutral-900 hover:bg-neutral-100 font-medium shadow-[0_4px_20px_rgba(0,0,0,0.3)] border border-white/80",
    ghost:
      "bg-transparent hover:bg-white/[0.06] text-neutral-400 hover:text-neutral-200 border border-transparent",
    danger:
      "bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20",
  };

  return (
    <motion.button
      whileHover={disabled ? undefined : { scale: 1.01 }}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={cn(
        "group relative inline-flex items-center justify-center rounded-full font-medium tracking-tight",
        "transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50",
        "disabled:opacity-50 disabled:pointer-events-none cursor-pointer select-none",
        sizeClasses[size],
        variantClasses[variant],
        fullWidth && "w-full",
        className
      )}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="shrink-0 flex items-center">{icon}</span>}
      <span className="truncate">{children}</span>
      {trailingIcon && (
        <span className="shrink-0 flex items-center justify-center w-7 h-7 rounded-full bg-black/10 dark:bg-white/15 ml-1 transition-transform duration-300 group-hover:translate-x-0.5">
          {trailingIcon}
        </span>
      )}
    </motion.button>
  );
}
