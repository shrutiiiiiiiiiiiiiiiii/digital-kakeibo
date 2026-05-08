"use client";

import { useEffect, useRef, useState } from "react";
import { CURRENCY_LABELS, SUPPORTED_CURRENCIES, type SupportedCurrency } from "@/lib/currencies";

type CurrencySelectProps = {
  value: string;
  onChange: (next: SupportedCurrency) => void;
  id?: string;
};

export function CurrencySelect({ value, onChange, id }: CurrencySelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDocClick(event: MouseEvent) {
      const target = event.target as Node;
      if (!rootRef.current?.contains(target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const selected = SUPPORTED_CURRENCIES.find((code) => code === value) ?? "JPY";

  return (
    <div ref={rootRef} className="relative">
      <button
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className="flex min-h-[52px] w-full items-center justify-between rounded-xl border border-black/15 bg-white/70 px-4 font-display text-sm tracking-[0.08em] text-sumi shadow-sm backdrop-blur-sm outline-none transition hover:border-black/25 focus:border-enji dark:border-white/15 dark:bg-white/5 dark:text-washi"
      >
        <span>{CURRENCY_LABELS[selected]}</span>
        <span className="text-xs text-black/55 dark:text-washi/70">{open ? "▲" : "▼"}</span>
      </button>

      {open ? (
        <div
          role="listbox"
          className="absolute z-30 mt-2 max-h-60 w-full overflow-auto rounded-xl border border-black/10 bg-[#fffaf4] p-1 shadow-[0_14px_30px_-20px_rgba(0,0,0,0.45)] dark:border-white/10 dark:bg-[#22262d]"
        >
          {SUPPORTED_CURRENCIES.map((code) => {
            const isSelected = code === selected;
            return (
              <button
                key={code}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(code);
                  setOpen(false);
                }}
                className={[
                  "flex w-full items-center rounded-lg px-3 py-2 text-left font-display text-sm tracking-[0.06em] transition",
                  isSelected
                    ? "bg-kinari text-sumi dark:bg-white/15 dark:text-washi"
                    : "text-black/75 hover:bg-black/5 dark:text-washi/85 dark:hover:bg-white/10",
                ].join(" ")}
              >
                {CURRENCY_LABELS[code]}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
