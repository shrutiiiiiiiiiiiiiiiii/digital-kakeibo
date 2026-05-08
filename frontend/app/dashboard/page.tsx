"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/design-system/Button";
import { Card } from "@/components/design-system/Card";
import { Modal } from "@/components/design-system/Modal";
import { Spacer } from "@/components/design-system/Spacer";
import { ThemeToggle } from "@/components/design-system/ThemeToggle";
import {
  getUserTimeZone,
  localWeekday,
  utcIsoRangeForCurrentLocalWeek,
  utcIsoRangeForLocalDays,
  weekPeriodFromDate,
} from "@/lib/datetime";
import { fetchEntries } from "@/lib/entries-api";
import type { EntryCategory } from "@/lib/entries";
import { formatMoney } from "@/lib/money";
import { fetchWeeklyReflectionContext } from "@/lib/reflections-api";
import { fetchWeekSummary } from "@/lib/summary-api";
import { useToast } from "@/lib/toast";
import { fetchMonthlyStatus, skipMonthlyClose } from "@/lib/monthly-api";
import { fetchWeeklyAiInsights } from "@/lib/ai-insights-api";

function DashboardContent() {
  const router = useRouter();
  const { user, logout, accessToken, isLoading } = useAuth();
  const { pushToast } = useToast();
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isMonthlyPromptDismissed, setIsMonthlyPromptDismissed] = useState(false);

  const timeZone = getUserTimeZone();
  const locale = user?.locale ?? "en";
  const currency = user?.settings.baseCurrency ?? user?.settings.currency ?? "JPY";
  const localeCode = locale === "ja" ? "ja-JP" : "en-US";
  const reminderDay = user?.settings.weeklyReminderDay ?? 0;

  const weekRange = useMemo(() => utcIsoRangeForCurrentLocalWeek(timeZone), [timeZone]);
  const weekPeriod = useMemo(() => weekPeriodFromDate(new Date()), []);
  const recentRange = useMemo(
    () =>
      utcIsoRangeForLocalDays({
        anchor: new Date(),
        pastDays: 45,
        futureDays: 0,
        timeZone,
      }),
    [timeZone]
  );

  const recentEntriesQuery = useQuery({
    queryKey: ["entries", "recent", { from: recentRange.fromUtc, to: recentRange.toUtc }],
    enabled: Boolean(accessToken),
    queryFn: async () => {
      if (!accessToken) throw new Error("Not authenticated");
      return fetchEntries(accessToken, { from: recentRange.fromUtc, to: recentRange.toUtc });
    },
  });

  const weekSummaryQuery = useQuery({
    queryKey: ["summary", "week", weekRange],
    enabled: Boolean(accessToken),
    queryFn: async () => {
      if (!accessToken) throw new Error("Not authenticated");
      return fetchWeekSummary(accessToken, {
        from: weekRange.fromUtc,
        to: weekRange.toUtc,
      });
    },
  });

  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [selectedSummaryCurrency, setSelectedSummaryCurrency] = useState<string | null>(null);

  const aiInsightMutation = useMutation({
    mutationFn: async () => {
      if (!accessToken) throw new Error("Not authenticated");
      return fetchWeeklyAiInsights(accessToken, {
        from: weekRange.fromUtc,
        to: weekRange.toUtc,
      });
    },
    onSuccess: (data) => {
      setAiInsight(data.insight);
      pushToast({ tone: "success", message: "Gemini insight ready." });
    },
    onError: (error) => {
      pushToast({
        tone: "danger",
        message: error instanceof Error ? error.message : "Could not generate Gemini insight.",
      });
    },
  });

  const reflectionContextQuery = useQuery({
    queryKey: ["reflections", "weekly", "current", { period: weekPeriod, ...weekRange }],
    enabled: Boolean(accessToken),
    queryFn: async () => {
      if (!accessToken) throw new Error("Not authenticated");
      return fetchWeeklyReflectionContext(accessToken, {
        period: weekPeriod,
        from: weekRange.fromUtc,
        to: weekRange.toUtc,
      });
    },
  });
  const showWeeklyReminder =
    !reflectionContextQuery.isLoading &&
    !reflectionContextQuery.data?.reflection &&
    localWeekday(new Date()) === reminderDay;

  const monthlyStatusQuery = useQuery({
    queryKey: ["monthly", "status"],
    enabled: Boolean(accessToken),
    queryFn: async () => {
      if (!accessToken) throw new Error("Not authenticated");
      return fetchMonthlyStatus(accessToken, new Date().toISOString());
    },
  });

  const shouldShowMonthlyPrompt = Boolean(monthlyStatusQuery.data?.shouldPrompt);

  useEffect(() => {
    if (!isLoading && user && !user.onboardingCompleted) {
      router.replace("/onboarding");
    }
  }, [isLoading, router, user]);

  const recentEntries = recentEntriesQuery.data?.entries?.slice(0, 5) ?? [];
  const allEntriesCount = recentEntriesQuery.data?.entries?.length ?? 0;

  const categoryOrder: EntryCategory[] = ["needs", "wants", "culture", "unexpected"];
  const categoryLabels: Record<EntryCategory, string> = {
    needs: locale === "ja" ? "必要" : "Needs",
    wants: locale === "ja" ? "欲しい" : "Wants",
    culture: locale === "ja" ? "文化" : "Culture",
    unexpected: locale === "ja" ? "意外" : "Unexpected",
  };
  const categoryColors: Record<EntryCategory, string> = {
    needs: "bg-sumi",
    wants: "bg-ai",
    culture: "bg-cha",
    unexpected: "bg-enji",
  };

  const currencySummaries = weekSummaryQuery.data?.byCurrency ?? [];
  const selectedCurrencySummary =
    currencySummaries.find((item) => item.currency === selectedSummaryCurrency) ??
    currencySummaries[0] ??
    null;
  const summaryCurrency = selectedCurrencySummary?.currency ?? currency;
  const summaryTotalSpent = selectedCurrencySummary?.totalSpent ?? 0;
  const summaryByCategory = selectedCurrencySummary?.byCategory;

  useEffect(() => {
    if (!currencySummaries.length) {
      setSelectedSummaryCurrency(null);
      return;
    }
    setSelectedSummaryCurrency((prev) => {
      if (prev && currencySummaries.some((item) => item.currency === prev)) return prev;
      return currencySummaries[0].currency;
    });
  }, [currencySummaries]);

  async function onLogout() {
    await logout();
    pushToast({ message: "You are logged out.", tone: "neutral" });
    router.push("/login");
  }

  async function onSkipMonthly() {
    if (!accessToken || !monthlyStatusQuery.data?.targetMonthYear) return;
    await skipMonthlyClose(accessToken, {
      targetMonthYear: monthlyStatusQuery.data.targetMonthYear,
    });
    setIsMonthlyPromptDismissed(true);
    pushToast({ tone: "neutral", message: "We will remind you again in 3 days." });
    await monthlyStatusQuery.refetch();
  }

  return (
    <main className="kakeibo-shell min-h-screen bg-background px-6 py-10 text-foreground">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-4">
          <p className="font-sans text-xs font-semibold tracking-[0.28em] uppercase text-muted-foreground">Dashboard</p>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/" className="rounded-full border border-black/10 bg-white/70 px-4 py-2 font-display text-sm tracking-[0.12em] text-black/65 shadow-sm transition hover:-translate-y-0.5 hover:border-black/20 hover:text-foreground dark:border-white/15 dark:bg-white/5 dark:text-muted-foreground">
              Home
            </Link>
            <Link href="/entries" className="rounded-full border border-black/10 bg-white/70 px-4 py-2 font-display text-sm tracking-[0.12em] text-black/65 shadow-sm transition hover:-translate-y-0.5 hover:border-black/20 hover:text-foreground dark:border-white/15 dark:bg-white/5 dark:text-muted-foreground">
              Entries
            </Link>
            <Link href="/monthly/archive" className="rounded-full border border-black/10 bg-white/70 px-4 py-2 font-display text-sm tracking-[0.12em] text-black/65 shadow-sm transition hover:-translate-y-0.5 hover:border-black/20 hover:text-foreground dark:border-white/15 dark:bg-white/5 dark:text-muted-foreground">
              Monthly
            </Link>
          </div>
        </div>
        <ThemeToggle />
      </div>

      <Spacer size="lg" />

      <div className="mx-auto w-full max-w-4xl">
        <div className="kakeibo-panel relative overflow-hidden rounded-3xl border border-black/10 bg-white/80 px-7 py-7 shadow-[0_20px_40px_-24px_rgba(0,0,0,0.35)] dark:border-white/10 dark:bg-[#1f232b]/92 dark:shadow-[0_24px_44px_-24px_rgba(0,0,0,0.82)] sm:px-8">
          <div className="pointer-events-none absolute -top-10 right-0 h-40 w-40 rounded-full bg-enji/20 blur-3xl dark:bg-enji/30" />
          <div className="pointer-events-none absolute -bottom-12 left-8 h-40 w-40 rounded-full bg-ai/20 blur-3xl dark:bg-ai/30" />
          <div className="relative grid gap-5 sm:grid-cols-3">
            <div className="sm:col-span-2 space-y-2">
              <p className="font-sans text-xs font-semibold tracking-[0.24em] uppercase text-muted-foreground">Mindful money ritual</p>
              <h1 className="font-display text-3xl tracking-[0.05em] text-black/85 dark:text-washi sm:text-4xl">Welcome back</h1>
              <p className="font-sans text-sm leading-7 text-muted-foreground">
                Signed in as <span className="font-medium text-foreground">{user?.email}</span>
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-1">
              <div className="rounded-2xl border border-black/10 bg-white/85 px-4 py-3 shadow-[0_10px_18px_-14px_rgba(0,0,0,0.25)] dark:border-white/10 dark:bg-white/8 dark:shadow-none">
                <p className="font-sans text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Entries</p>
                <p className="mt-1 font-mono text-xl tabular-nums">{allEntriesCount}</p>
              </div>
              <div className="rounded-2xl border border-black/10 bg-white/85 px-4 py-3 shadow-[0_10px_18px_-14px_rgba(0,0,0,0.25)] dark:border-white/10 dark:bg-white/8 dark:shadow-none">
                <p className="font-sans text-[11px] uppercase tracking-[0.14em] text-muted-foreground">This week</p>
                <p className="mt-1 font-mono text-xl tabular-nums">
                  {formatMoney(summaryTotalSpent, summaryCurrency, localeCode)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Spacer size="md" />

      <div className="mx-auto flex w-full max-w-4xl justify-end">
        <Link
          href="/entries/new"
          className="animate-soft-float inline-flex min-h-[64px] items-center justify-center rounded-full border border-black/20 bg-white px-7 font-display text-[30px] leading-none text-sumi shadow-[0_14px_24px_-16px_rgba(0,0,0,0.45)] transition hover:-translate-y-1 hover:shadow-[0_18px_30px_-16px_rgba(0,0,0,0.55)] dark:border-white/20 dark:bg-[#2a2e36] dark:text-washi"
          aria-label="Add entry"
        >
          +
        </Link>
      </div>

      <Spacer size="md" />

      <div className="mx-auto flex w-full max-w-4xl justify-center">
        <Card className="kakeibo-panel w-full space-y-8 border-black/10 bg-white/80 shadow-[0_20px_40px_-24px_rgba(0,0,0,0.35)] dark:border-white/10 dark:bg-[#1f232b]/92 dark:shadow-[0_24px_44px_-26px_rgba(0,0,0,0.8)]">
          <p className="font-sans text-[15px] leading-7 text-black/65 dark:text-muted-foreground">
            This week at a glance: clear category balance, recent entries, and one-tap recording.
          </p>

          {showWeeklyReminder ? (
            <div className="rounded-2xl border border-black/10 bg-white/70 px-5 py-4 backdrop-blur-sm dark:border-white/10 dark:bg-white/5">
              <p className="font-display text-base tracking-[0.08em] text-black/80 dark:text-washi">Weekly reflection is ready</p>
              <p className="mt-2 font-sans text-sm leading-7 text-muted-foreground">
                A gentle Sunday ritual helps spending become conscious. It takes under two minutes.
              </p>
              <div className="mt-4">
                <Link
                  href="/reflections/new"
                  className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-black/15 bg-kinari px-4 font-display text-sm tracking-[0.08em] text-sumi shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/15 dark:bg-sumi/45 dark:text-washi"
                >
                  Reflect now
                </Link>
              </div>
            </div>
          ) : null}

          {shouldShowMonthlyPrompt ? (
            <div className="rounded-2xl border border-black/10 bg-white/70 px-5 py-4 backdrop-blur-sm dark:border-white/10 dark:bg-white/5">
              <p className="font-display text-base tracking-[0.08em] text-black/80 dark:text-washi">Monthly close is ready</p>
              <p className="mt-2 font-sans text-sm leading-7 text-muted-foreground">
                Quietly close {monthlyStatusQuery.data?.targetMonthYear} in 4 prompts.
              </p>
              <div className="mt-4">
                <Button
                  type="button"
                  onClick={() => {
                    setIsMonthlyPromptDismissed(false);
                  }}
                >
                  Start monthly ritual
                </Button>
              </div>
            </div>
          ) : null}

          <div className="space-y-4">
            <div className="flex items-end justify-between gap-4">
              <h2 className="font-display text-2xl tracking-[0.1em] text-black/85 dark:text-foreground">This week</h2>
              <Link href="/entries" className="font-sans text-sm text-muted-foreground underline decoration-black/20 underline-offset-8 hover:decoration-sumi dark:decoration-washi/30">
                View all
              </Link>
            </div>

            {weekSummaryQuery.isLoading ? (
              <p className="font-sans text-sm text-muted-foreground">Loading weekly summary…</p>
            ) : weekSummaryQuery.isError ? (
              <p className="font-sans text-sm text-enji">Could not load weekly summary.</p>
            ) : (
              <div className="space-y-6">
                <div className="space-y-3">
                  {currencySummaries.length > 1 ? (
                    <div className="flex flex-wrap gap-2">
                      {currencySummaries.map((item) => {
                        const isSelected = summaryCurrency === item.currency;
                        return (
                          <button
                            key={item.currency}
                            type="button"
                            onClick={() => setSelectedSummaryCurrency(item.currency)}
                            className={[
                              "rounded-full border px-3 py-1 font-sans text-xs tracking-[0.08em] transition",
                              isSelected
                                ? "border-sumi bg-kinari text-sumi dark:border-white/25 dark:bg-white/15 dark:text-washi"
                                : "border-black/15 bg-white/60 text-muted-foreground hover:text-foreground dark:border-white/15 dark:bg-white/5 dark:text-muted-foreground",
                            ].join(" ")}
                          >
                            {item.currency}
                          </button>
                        );
                      })}
                    </div>
                  ) : null}

                  <div className="flex items-end justify-between">
                    <p className="font-sans text-sm text-muted-foreground">Total spent this week</p>
                    <p className="font-mono text-2xl tabular-nums">
                      {formatMoney(summaryTotalSpent, summaryCurrency, localeCode)}
                    </p>
                  </div>

                  <div className="overflow-hidden rounded-full border border-black/10 bg-black/10 dark:border-white/10 dark:bg-white/10">
                    <div className="flex h-5 w-full">
                      {categoryOrder.map((cat) => {
                        const total = summaryByCategory?.[cat]?.total ?? 0;
                        const all = summaryTotalSpent;
                        const pct = all > 0 ? (total / all) * 100 : 0;
                        return (
                          <div
                            key={cat}
                            className={[categoryColors[cat], "transition-[width] duration-300"].join(" ")}
                            style={{ width: `${pct}%`, minWidth: total > 0 ? 6 : 0 }}
                            title={`${categoryLabels[cat]} ${formatMoney(total, summaryCurrency, localeCode)}`}
                          />
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {categoryOrder.map((cat) => {
                      const total = summaryByCategory?.[cat]?.total ?? 0;
                      return (
                        <div
                          key={cat}
                          className="rounded-2xl border border-black/10 bg-white/70 px-4 py-3 shadow-[0_10px_18px_-16px_rgba(0,0,0,0.2)] backdrop-blur-sm dark:border-white/10 dark:bg-white/5 dark:shadow-none"
                        >
                          <p className="font-display text-xs tracking-[0.18em] text-black/60 dark:text-muted-foreground">
                            {categoryLabels[cat]}
                          </p>
                          <p className="mt-1 font-mono text-sm tabular-nums">
                            {formatMoney(total, summaryCurrency, localeCode)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-2xl border border-black/10 bg-white/70 px-5 py-4 backdrop-blur-sm dark:border-white/10 dark:bg-white/5">
                  <p className="font-display text-sm tracking-[0.14em] text-muted-foreground">Month progress</p>
                  <p className="mt-2 font-sans text-sm text-black/60 dark:text-muted-foreground">
                    Savings-goal progress appears after monthly ritual setup in a later phase.
                  </p>
                </div>

                <div className="space-y-3 rounded-2xl border border-black/10 bg-white/70 px-5 py-4 backdrop-blur-sm dark:border-white/10 dark:bg-white/5">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="font-display text-sm tracking-[0.14em] text-black/70 dark:text-muted-foreground">Gemini AI insight</p>
                    <Button
                      type="button"
                      onClick={() => aiInsightMutation.mutate()}
                      disabled={aiInsightMutation.isPending}
                      loading={aiInsightMutation.isPending}
                    >
                      Generate
                    </Button>
                  </div>
                  {aiInsightMutation.isPending ? (
                    <p className="font-sans text-sm text-muted-foreground">Generating…</p>
                  ) : aiInsight ? (
                    <p className="whitespace-pre-wrap font-sans text-sm leading-7 text-foreground">{aiInsight}</p>
                  ) : (
                    <p className="font-sans text-sm text-muted-foreground">
                      Get a short 4-line suggestion for next week based on your spending.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-end justify-between gap-4">
              <h2 className="font-display text-2xl tracking-[0.1em] text-black/85 dark:text-foreground">Recent entries</h2>
              <div className="flex items-center gap-4">
                <Link href="/entries" className="font-sans text-sm text-muted-foreground underline decoration-black/20 underline-offset-8 hover:decoration-sumi dark:decoration-washi/30">
                  View all
                </Link>
                <Link href="/reflections" className="font-sans text-sm text-muted-foreground underline decoration-black/20 underline-offset-8 hover:decoration-sumi dark:decoration-washi/30">
                  Reflections
                </Link>
              </div>
            </div>

            {recentEntriesQuery.isLoading ? (
              <p className="font-sans text-sm text-muted-foreground">Loading recent entries…</p>
            ) : allEntriesCount === 0 ? (
              <div className="rounded-2xl border border-black/10 bg-white/70 px-5 py-6 backdrop-blur-sm dark:border-white/10 dark:bg-white/5">
                <p className="font-display text-lg tracking-[0.08em] text-black/85 dark:text-foreground">Your first step</p>
                <p className="mt-2 font-sans text-sm leading-7 text-black/60 dark:text-muted-foreground">
                  Tap + and record one expense from this week. Small, honest entries build the whole practice.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentEntries.map((entry) => (
                  <div
                    key={entry._id}
                    className="flex items-center justify-between gap-4 rounded-2xl border border-black/10 bg-white/70 px-5 py-4 backdrop-blur-sm transition hover:-translate-y-0.5 hover:border-black/20 dark:border-white/10 dark:bg-white/5 dark:hover:border-white/20"
                  >
                    <div className="space-y-1">
                      <p className="font-display text-sm tracking-[0.18em] text-black/60 dark:text-muted-foreground">
                        {categoryLabels[entry.category]}
                      </p>
                      {entry.note ? (
                        <p className="font-sans text-sm text-muted-foreground">{entry.note}</p>
                      ) : null}
                      {entry.noteHandwritingImage ? (
                        <img
                          src={entry.noteHandwritingImage}
                          alt="Handwritten note"
                          className="mt-2 w-full max-w-[180px] rounded-lg border border-black/10 dark:border-white/10"
                        />
                      ) : null}
                    </div>
                    <p className="font-mono text-lg tabular-nums">
                      {formatMoney(entry.amount, entry.currency || currency, localeCode)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-stretch">
            <div className="flex-1">
              <Button type="button" onClick={() => setIsHelpOpen(true)}>
                Why this stays slow
              </Button>
            </div>
            <div className="flex-1">
              <Button type="button" onClick={onLogout}>
                Logout
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <Modal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        title="Mindful by design"
        description="Digital Kakeibo begins with handwriting your choices — friction is intentional. Speed comes later."
        primaryAction={{ label: "Understood", onClick: () => setIsHelpOpen(false) }}
      />

      <Modal
        isOpen={shouldShowMonthlyPrompt && !isMonthlyPromptDismissed}
        onClose={() => setIsMonthlyPromptDismissed(true)}
        title="Monthly close"
        description={`Close ${monthlyStatusQuery.data?.targetMonthYear ?? ""} in a short 4-question ritual and set next month's savings target.`}
        primaryAction={{
          label: "Start now",
          onClick: () => {
            setIsMonthlyPromptDismissed(true);
            router.push("/monthly/close");
          },
        }}
        secondaryAction={{
          label: "Remind in 3 days",
          onClick: () => {
            void onSkipMonthly();
          },
        }}
      />
    </main>
  );
}

export default function DashboardPage() {
  return <DashboardContent />;
}
