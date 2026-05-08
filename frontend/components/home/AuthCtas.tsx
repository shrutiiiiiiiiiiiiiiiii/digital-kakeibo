"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";

export function HeroAuthCtas() {
  const { user, accessToken, isLoading } = useAuth();
  const isLoggedIn = Boolean(user || accessToken);

  if (isLoading) {
    return (
      <div className="space-y-2">
        <p className="font-sans text-sm text-muted-foreground">Checking your session status...</p>
        <div className="inline-flex min-h-[60px] items-center justify-center rounded-xl border border-black/10 bg-white/60 px-7 font-sans text-sm text-muted-foreground dark:border-white/10 dark:bg-sumi/30">
          Checking session...
        </div>
      </div>
    );
  }

  if (isLoggedIn) {
    return (
      <div className="space-y-2">
        <p className="font-sans text-sm text-muted-foreground">
          Signed in as <span className="font-medium text-foreground">{user?.email ?? "authenticated user"}</span>
        </p>
        <Link
          href="/dashboard"
          className="inline-flex min-h-[60px] items-center justify-center rounded-xl border border-sumi bg-gradient-to-b from-kinari to-[#e8dbc6] px-7 text-[15px] font-medium text-sumi shadow-[0_14px_30px_-18px_rgba(0,0,0,0.65)] transition hover:-translate-y-1 hover:shadow-[0_18px_36px_-18px_rgba(0,0,0,0.72)]"
        >
          <span className="font-display tracking-[0.05em]">Go to dashboard</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="font-sans text-sm text-muted-foreground">You are browsing as a guest.</p>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <Link
          href="/signup"
          className="inline-flex min-h-[60px] items-center justify-center rounded-xl border border-sumi bg-gradient-to-b from-kinari to-[#e8dbc6] px-7 text-[15px] font-medium text-sumi shadow-[0_14px_30px_-18px_rgba(0,0,0,0.65)] transition hover:-translate-y-1 hover:shadow-[0_18px_36px_-18px_rgba(0,0,0,0.72)]"
        >
          <span className="font-display tracking-[0.05em]">Start for free</span>
        </Link>
        <Link
          href="/login"
          className="inline-flex min-h-[60px] items-center justify-center rounded-xl border border-black/15 bg-white/70 px-7 text-[15px] font-medium text-sumi shadow-sm backdrop-blur-sm transition hover:-translate-y-0.5 hover:shadow-lg dark:border-white/10 dark:bg-sumi/30 dark:text-washi"
        >
          <span className="font-display tracking-[0.06em]">Log in</span>
        </Link>
      </div>
    </div>
  );
}

export function FinalAuthCta() {
  const { user, accessToken, isLoading } = useAuth();
  const isLoggedIn = Boolean(user || accessToken);

  if (isLoading) {
    return (
      <span className="inline-flex min-h-[56px] items-center justify-center rounded-xl border border-black/10 bg-white/60 px-6 font-sans text-sm text-muted-foreground dark:border-white/10 dark:bg-sumi/30">
        Checking session...
      </span>
    );
  }

  return isLoggedIn ? (
    <Link
      href="/dashboard"
      className="inline-flex min-h-[56px] items-center justify-center rounded-xl border border-sumi bg-kinari px-6 font-display tracking-[0.05em] text-sumi shadow-md transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      Dashboard
    </Link>
  ) : (
    <Link
      href="/signup"
      className="inline-flex min-h-[56px] items-center justify-center rounded-xl border border-sumi bg-kinari px-6 font-display tracking-[0.05em] text-sumi shadow-md transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      Create account
    </Link>
  );
}
