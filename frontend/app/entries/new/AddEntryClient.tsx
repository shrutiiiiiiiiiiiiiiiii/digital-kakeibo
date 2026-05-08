"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/design-system/Button";
import { CurrencySelect } from "@/components/design-system/CurrencySelect";
import { Input } from "@/components/design-system/Input";
import { HandwritingPad } from "@/components/HandwritingPad";
import { Spacer } from "@/components/design-system/Spacer";
import { ThemeToggle } from "@/components/design-system/ThemeToggle";
import { useAuth } from "@/lib/auth";
import { isSupportedCurrency, isZeroDecimalCurrency } from "@/lib/currencies";
import { createEntry } from "@/lib/entries-api";
import type { EntryCategory } from "@/lib/entries";

const CATEGORIES: { key: EntryCategory; labelEn: string; labelJa: string }[] = [
  { key: "needs", labelEn: "Needs", labelJa: "必要" },
  { key: "wants", labelEn: "Wants", labelJa: "欲しい" },
  { key: "culture", labelEn: "Culture", labelJa: "文化" },
  { key: "unexpected", labelEn: "Unexpected", labelJa: "意外" },
];

export function AddEntryClient() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { accessToken, user } = useAuth();

  const locale = user?.locale ?? "en";
  const preferredCurrency = user?.settings.baseCurrency ?? user?.settings.currency ?? "JPY";
  const defaultCurrency = isSupportedCurrency(preferredCurrency) ? preferredCurrency : "JPY";

  const [digits, setDigits] = useState("");
  const [currency, setCurrency] = useState(defaultCurrency);
  const [category, setCategory] = useState<EntryCategory>("needs");
  const [note, setNote] = useState("");
  const [noteHandwritingImage, setNoteHandwritingImage] = useState("");
  const [noteMode, setNoteMode] = useState<"text" | "handwrite">("text");
  const [phase, setPhase] = useState<"editing" | "saving" | "done">("editing");

  const hiddenInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    hiddenInputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!isZeroDecimalCurrency(currency)) return;
    setDigits((prev) => prev.replace(/\./g, ""));
  }, [currency]);

  const amountNumber = useMemo(() => {
    if (!digits) return 0;
    if (isZeroDecimalCurrency(currency)) return Number.parseInt(digits, 10) || 0;
    const n = Number.parseFloat(digits);
    return Number.isFinite(n) ? n : 0;
  }, [currency, digits]);

  const displayAmount = useMemo(() => {
    if (!digits) return "—";
    if (isZeroDecimalCurrency(currency)) {
      return new Intl.NumberFormat(locale === "ja" ? "ja-JP" : "en-US", {
        maximumFractionDigits: 0,
      }).format(amountNumber);
    }
    return new Intl.NumberFormat(locale === "ja" ? "ja-JP" : "en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amountNumber);
  }, [amountNumber, currency, digits, locale]);

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!accessToken) throw new Error("Not authenticated");
      if (amountNumber <= 0) throw new Error("Enter an amount");
      return createEntry(accessToken, {
        amount: amountNumber,
        currency,
        category,
        note: note.trim() ? note.trim() : undefined,
        noteHandwritingImage: noteHandwritingImage || undefined,
      });
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["entries"] });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["entries"] });
    },
  });

  async function onSave() {
    if (amountNumber <= 0) return;
    setPhase("saving");
    try {
      await createMutation.mutateAsync();
      setPhase("done");
      window.setTimeout(() => {
        router.replace("/entries");
      }, 650);
    } catch {
      setPhase("editing");
    }
  }

  function appendDigit(d: string) {
    if (phase !== "editing") return;
    if (currency === "JPY") {
      if (!/^\d$/.test(d)) return;
      if (digits.length >= 8) return;
      setDigits((prev) => `${prev}${d}`);
      return;
    }
    if (d === ".") {
      if (digits.includes(".")) return;
      setDigits((prev) => (prev.length ? `${prev}.` : "0."));
      return;
    }
    if (!/^\d$/.test(d)) return;
    setDigits((prev) => `${prev}${d}`);
  }

  function backspace() {
    if (phase !== "editing") return;
    setDigits((prev) => prev.slice(0, -1));
  }

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-background">
      <div className="flex items-start justify-between gap-6 px-6 pt-8">
        <Link href="/entries" className="font-display text-[15px] tracking-[0.16em] text-muted-foreground">
          Close
        </Link>
        <ThemeToggle />
      </div>

      <div className="min-h-0 flex flex-1 flex-col overflow-y-auto px-6 pb-10">
        <Spacer size="lg" />

        <div className="mx-auto flex w-full max-w-xl flex-1 flex-col">
          <input
            ref={hiddenInputRef}
            defaultValue=""
            aria-hidden
            className="sr-only"
            onKeyDown={(e) => {
              if (e.key === "Backspace") {
                e.preventDefault();
                backspace();
              }
              if (/^\d$/.test(e.key)) {
                e.preventDefault();
                appendDigit(e.key);
              }
              if (!isZeroDecimalCurrency(currency) && e.key === ".") {
                e.preventDefault();
                appendDigit(".");
              }
            }}
          />

          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <p className="font-sans text-xs font-semibold tracking-[0.28em] uppercase text-muted-foreground">
              Amount
            </p>
            <Spacer size="md" />
            <div
              className={[
                "font-display text-6xl tracking-tight text-foreground transition-opacity duration-300",
                phase === "done" ? "opacity-40" : "opacity-100",
              ].join(" ")}
            >
              {displayAmount}
              <span className="ml-3 font-sans text-2xl text-muted-foreground">{currency}</span>
            </div>

            {phase === "done" ? (
              <p className="mt-6 font-display text-lg tracking-[0.18em] text-muted-foreground">Recorded</p>
            ) : null}

            <div aria-hidden className="mt-10 h-px w-40 bg-sumi/20" />
          </div>

          <Spacer size="lg" />

          <div className="space-y-3">
            <p className="font-sans text-xs font-semibold tracking-[0.28em] uppercase text-muted-foreground">
              Currency
            </p>
            <CurrencySelect id="entry-currency-select" value={currency} onChange={setCurrency} />
          </div>

          <Spacer size="md" />

          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9", isZeroDecimalCurrency(currency) ? "" : ".", "0", "⌫"].map((key) => {
              if (key === "") return <div key="empty" />;
              if (key === "⌫") {
                return (
                  <button
                    key="back"
                    type="button"
                    className="min-h-[60px] rounded-xl border border-black/15 bg-white/60 font-display text-lg text-sumi shadow-sm backdrop-blur-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-sumi/35 dark:text-washi"
                    onClick={backspace}
                  >
                    ⌫
                  </button>
                );
              }
              return (
                <button
                  key={key}
                  type="button"
                  className="min-h-[60px] rounded-xl border border-black/15 bg-white/60 font-mono text-2xl text-sumi shadow-sm backdrop-blur-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-sumi/35 dark:text-washi"
                  onClick={() => appendDigit(key)}
                >
                  {key}
                </button>
              );
            })}
          </div>

          <Spacer size="lg" />

          <div className="space-y-3">
            <p className="font-sans text-xs font-semibold tracking-[0.28em] uppercase text-muted-foreground">
              Category
            </p>
            <div className="grid grid-cols-2 gap-3">
              {CATEGORIES.map((c) => {
                const selected = c.key === category;
                const label = locale === "ja" ? c.labelJa : c.labelEn;
                return (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => setCategory(c.key)}
                    className={[
                      "min-h-[60px] rounded-2xl border px-4 text-left font-display text-[15px] tracking-[0.08em] transition",
                      selected
                        ? "border-sumi bg-kinari text-sumi shadow-md dark:border-washi dark:bg-sumi/40 dark:text-washi"
                        : "border-black/15 bg-white/55 text-sumi shadow-sm backdrop-blur-sm hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-sumi/25 dark:text-washi",
                    ].join(" ")}
                  >
                    <span className="block">{label}</span>
                    {selected ? <span className="mt-2 block h-px w-10 bg-sumi dark:bg-washi" /> : null}
                  </button>
                );
              })}
            </div>
          </div>

          <Spacer size="lg" />

          <div className="flex gap-3">
            <Button type="button" onClick={() => setNoteMode("text")}>
              Type note
            </Button>
            <Button type="button" onClick={() => setNoteMode("handwrite")}>
              Handwrite note
            </Button>
          </div>
          {noteMode === "text" ? (
            <Input
              label="Note (optional)"
              placeholder="One quiet line…"
              value={note}
              maxLength={50}
              onChange={(e) => setNote(e.target.value)}
            />
          ) : (
            <HandwritingPad value={noteHandwritingImage} onChange={setNoteHandwritingImage} />
          )}

          <Spacer size="lg" />

          <div className="sticky bottom-0 -mx-2 mt-2 bg-gradient-to-t from-background via-background/95 to-transparent px-2 pb-1 pt-4">
            <Button
              type="button"
              loading={phase === "saving" || createMutation.isPending}
              onClick={onSave}
              disabled={phase !== "editing" || amountNumber <= 0}
            >
              Record
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
