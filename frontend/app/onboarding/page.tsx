"use client";

import { useMutation } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/design-system/Button";
import { Card } from "@/components/design-system/Card";
import { CurrencySelect } from "@/components/design-system/CurrencySelect";
import { HandwritingPad } from "@/components/HandwritingPad";
import { Input } from "@/components/design-system/Input";
import { ThemeToggle } from "@/components/design-system/ThemeToggle";
import { useAuth } from "@/lib/auth";
import { isZeroDecimalCurrency } from "@/lib/currencies";
import { createEntry } from "@/lib/entries-api";
import type { EntryCategory } from "@/lib/entries";
import { useToast } from "@/lib/toast";

const STORAGE_KEY = "dk:onboarding:v1";
const CATEGORIES: EntryCategory[] = ["needs", "wants", "culture", "unexpected"];

type Draft = {
  step: number;
  locale: "en" | "ja";
  baseCurrency: string;
  weeklyReminderDay: number;
  amount: string;
  category: EntryCategory;
  note: string;
  noteHandwritingImage: string;
  noteMode: "text" | "handwrite";
};

const INITIAL_DRAFT: Draft = {
  step: 0,
  locale: "en",
  baseCurrency: "INR",
  weeklyReminderDay: 0,
  amount: "",
  category: "needs",
  note: "",
  noteHandwritingImage: "",
  noteMode: "text",
};

export default function OnboardingPage() {
  const router = useRouter();
  const { user, accessToken, completeOnboarding } = useAuth();
  const { pushToast } = useToast();
  const [draft, setDraft] = useState<Draft>(() => {
    if (typeof window === "undefined") return INITIAL_DRAFT;
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return INITIAL_DRAFT;
    try {
      const parsed = JSON.parse(saved) as Partial<Draft>;
      return {
        ...INITIAL_DRAFT,
        ...parsed,
        step: Math.min(Math.max(Number(parsed.step) || 0, 0), 4),
      };
    } catch {
      return INITIAL_DRAFT;
    }
  });

  useEffect(() => {
    if (user?.onboardingCompleted) {
      router.replace("/dashboard");
    }
  }, [router, user?.onboardingCompleted]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  }, [draft]);

  const labels = useMemo(
    () => ({
      needs: draft.locale === "ja" ? "必要" : "Needs",
      wants: draft.locale === "ja" ? "欲しい" : "Wants",
      culture: draft.locale === "ja" ? "文化" : "Culture",
      unexpected: draft.locale === "ja" ? "意外" : "Unexpected",
    }),
    [draft.locale]
  );

  const finishMutation = useMutation({
    mutationFn: async () => {
      if (!accessToken) throw new Error("Not authenticated");
      const amount = Number(draft.amount);
      if (Number.isFinite(amount) && amount > 0) {
        await createEntry(accessToken, {
          amount,
          currency: draft.baseCurrency,
          category: draft.category,
          note: draft.note.trim() || undefined,
          noteHandwritingImage: draft.noteHandwritingImage || undefined,
        });
      }
      await completeOnboarding({
        locale: draft.locale,
        baseCurrency: draft.baseCurrency,
        weeklyReminderDay: draft.weeklyReminderDay,
      });
    },
    onSuccess: () => {
      window.localStorage.removeItem(STORAGE_KEY);
      pushToast({ tone: "success", message: "Welcome. Your first chapter begins." });
      router.push("/dashboard");
    },
  });

  const canNextFromSettings = Boolean(draft.baseCurrency.trim());
  const canFinish = !draft.amount || Number(draft.amount) > 0;

  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground">
      <div className="mx-auto w-full max-w-3xl space-y-8">
        <div className="flex items-start justify-end">
          <ThemeToggle />
        </div>

        <Card className="space-y-8">
          {draft.step === 0 ? (
            <section className="space-y-4">
              <p className="font-sans text-xs font-semibold tracking-[0.28em] uppercase text-muted-foreground">
                Welcome
              </p>
              <h1 className="font-display text-4xl tracking-[0.08em]">Kakeibo - Mindful money since 1904</h1>
              <p className="font-sans text-[15px] leading-8 text-muted-foreground">
                This app is not about speed. It is about awareness, one honest entry at a time.
              </p>
            </section>
          ) : null}

          {draft.step === 1 ? (
            <section className="space-y-4">
              <p className="font-sans text-xs font-semibold tracking-[0.28em] uppercase text-muted-foreground">
                Story
              </p>
              <h1 className="font-display text-3xl tracking-[0.08em]">A short history</h1>
              <p className="font-sans text-[15px] leading-8 text-muted-foreground">
                Kakeibo began in 1904 with Hani Motoko. The practice asks gentle questions so money follows
                values, not impulse.
              </p>
            </section>
          ) : null}

          {draft.step === 2 ? (
            <section className="space-y-4">
              <p className="font-sans text-xs font-semibold tracking-[0.28em] uppercase text-muted-foreground">
                Categories
              </p>
              <h1 className="font-display text-3xl tracking-[0.08em]">The four buckets</h1>
              <ul className="space-y-3 font-sans text-[15px] leading-8 text-muted-foreground">
                <li>Needs - essentials for living.</li>
                <li>Wants - comforts and treats.</li>
                <li>Culture - learning, books, art, growth.</li>
                <li>Unexpected - surprises and one-offs.</li>
              </ul>
            </section>
          ) : null}

          {draft.step === 3 ? (
            <section className="space-y-6">
              <p className="font-sans text-xs font-semibold tracking-[0.28em] uppercase text-muted-foreground">
                Settings
              </p>
              <h1 className="font-display text-3xl tracking-[0.08em]">Make it yours</h1>

              <div className="space-y-2">
                <p className="font-sans text-sm text-muted-foreground">Locale</p>
                <div className="flex gap-3">
                  {(["en", "ja"] as const).map((loc) => (
                    <Button key={loc} type="button" onClick={() => setDraft((p) => ({ ...p, locale: loc }))}>
                      {loc === "ja" ? "日本語" : "English"} {draft.locale === loc ? "✓" : ""}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <p className="block font-display text-[15px] font-medium tracking-[0.08em] text-sumi dark:text-washi">
                  Base currency
                </p>
                <CurrencySelect
                  id="onboarding-currency-select"
                  value={draft.baseCurrency}
                  onChange={(code) => setDraft((p) => ({ ...p, baseCurrency: code }))}
                />
              </div>

              <div className="space-y-2">
                <p className="font-sans text-sm text-muted-foreground">Weekly reflection day</p>
                <select
                  value={draft.weeklyReminderDay}
                  onChange={(e) => setDraft((p) => ({ ...p, weeklyReminderDay: Number(e.target.value) }))}
                  className="w-full rounded-xl border border-black/15 bg-white/60 px-4 py-3 text-sm dark:border-white/10 dark:bg-sumi/30"
                >
                  <option value={0}>Sunday</option>
                  <option value={1}>Monday</option>
                  <option value={2}>Tuesday</option>
                  <option value={3}>Wednesday</option>
                  <option value={4}>Thursday</option>
                  <option value={5}>Friday</option>
                  <option value={6}>Saturday</option>
                </select>
              </div>
            </section>
          ) : null}

          {draft.step === 4 ? (
            <section className="space-y-6">
              <p className="font-sans text-xs font-semibold tracking-[0.28em] uppercase text-muted-foreground">
                First entry
              </p>
              <h1 className="font-display text-3xl tracking-[0.08em]">Try one entry now</h1>
              <Input
                label="Amount"
                value={draft.amount}
                onChange={(e) => setDraft((p) => ({ ...p, amount: e.target.value }))}
                inputMode={isZeroDecimalCurrency(draft.baseCurrency) ? "numeric" : "decimal"}
                placeholder="1000"
              />
              <div className="space-y-2">
                <p className="font-sans text-sm text-muted-foreground">Category</p>
                <div className="grid grid-cols-2 gap-3">
                  {CATEGORIES.map((cat) => (
                    <Button key={cat} type="button" onClick={() => setDraft((p) => ({ ...p, category: cat }))}>
                      {labels[cat]} {draft.category === cat ? "✓" : ""}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex gap-3">
                  <Button type="button" onClick={() => setDraft((p) => ({ ...p, noteMode: "text" }))}>
                    Type note
                  </Button>
                  <Button type="button" onClick={() => setDraft((p) => ({ ...p, noteMode: "handwrite" }))}>
                    Handwrite note
                  </Button>
                </div>
                {draft.noteMode === "text" ? (
                  <Input
                    label="Note (optional)"
                    value={draft.note}
                    onChange={(e) => setDraft((p) => ({ ...p, note: e.target.value }))}
                    placeholder="Coffee with a friend"
                  />
                ) : (
                  <HandwritingPad
                    value={draft.noteHandwritingImage}
                    onChange={(dataUrl) => setDraft((p) => ({ ...p, noteHandwritingImage: dataUrl }))}
                  />
                )}
              </div>
            </section>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row">
            {draft.step < 4 ? (
              <Button
                type="button"
                onClick={() => setDraft((p) => ({ ...p, step: p.step + 1 }))}
                disabled={draft.step === 3 ? !canNextFromSettings : false}
              >
                Next
              </Button>
            ) : (
              <Button
                type="button"
                onClick={() => finishMutation.mutate()}
                loading={finishMutation.isPending}
                disabled={!canFinish}
              >
                Finish onboarding
              </Button>
            )}

            {draft.step > 0 ? (
              <Button type="button" onClick={() => setDraft((p) => ({ ...p, step: p.step - 1 }))}>
                Back
              </Button>
            ) : null}

            <button
              type="button"
              onClick={() => {
                finishMutation.mutate();
              }}
              className="min-h-[44px] rounded-xl px-3 text-left font-sans text-xs text-muted-foreground underline underline-offset-4"
            >
              Skip for now
            </button>
          </div>
        </Card>
      </div>
    </main>
  );
}
