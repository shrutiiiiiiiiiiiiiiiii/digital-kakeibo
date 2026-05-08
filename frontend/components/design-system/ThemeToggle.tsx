"use client";

import { useTheme } from "@/lib/theme";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="rounded-full border border-black/15 bg-washi/75 px-5 py-3 text-xs font-sans font-medium tracking-[0.22em] uppercase text-sumi shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] backdrop-blur-md transition hover:-translate-y-0.5 hover:shadow-[0_10px_20px_-14px_rgba(0,0,0,0.7)] dark:border-white/10 dark:bg-sumi/55 dark:text-washi dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]"
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      title={theme === "dark" ? "Light mode" : "Dark mode"}
    >
      {theme === "dark" ? "Light" : "Dark"}
    </button>
  );
}
