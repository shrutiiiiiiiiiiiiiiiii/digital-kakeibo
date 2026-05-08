"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = {
  loading?: boolean;
  children: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({
  loading = false,
  children,
  className,
  disabled,
  type = "button",
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      {...rest}
      type={type}
      disabled={isDisabled}
      className={[
        "inline-flex min-h-[60px] w-full items-center justify-center rounded-xl border border-sumi bg-kinari px-6 text-[15px] font-medium text-sumi",
        "dark:border-white/20 dark:bg-gradient-to-b dark:from-[#2b2c30] dark:to-[#1f2024] dark:text-washi",
        "shadow-[inset_0_1px_0_rgba(255,255,255,0.72),inset_0_-1px_0_rgba(0,0,0,0.08)]",
        "dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_10px_24px_-18px_rgba(0,0,0,0.8)]",
        "transition-[transform,box-shadow,filter] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_14px_28px_-18px_rgba(0,0,0,0.7)] hover:brightness-[1.03]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-enji/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:translate-y-0 disabled:opacity-60 disabled:hover:shadow-none disabled:hover:brightness-100",
        loading ? "motion-safe:animate-pulse" : "",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {loading ? (
        <span className="font-sans">Loading...</span>
      ) : (
        <span className="font-display text-[16px] tracking-[0.01em]">{children}</span>
      )}
    </button>
  );
}
