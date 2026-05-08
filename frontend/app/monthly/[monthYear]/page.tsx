"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { use, useMemo, useState } from "react";
import { Button } from "@/components/design-system/Button";
import { Card } from "@/components/design-system/Card";
import { ShareMonthlyCard } from "@/components/ShareMonthlyCard";
import { ThemeToggle } from "@/components/design-system/ThemeToggle";
import { useAuth } from "@/lib/auth";
import { fetchMonthlySummary } from "@/lib/monthly-api";
import { formatMoney } from "@/lib/money";
import { createShareCard } from "@/lib/share-cards-api";
import { useToast } from "@/lib/toast";

function formatMonthYearLabel(monthYear: string, locale: "en" | "ja") {
  const [yearText, monthText] = monthYear.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) return monthYear;
  return new Intl.DateTimeFormat(locale === "ja" ? "ja-JP" : "en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}

export default function MonthlySummaryPage({ params }: { params: Promise<{ monthYear: string }> }) {
  const { monthYear } = use(params);
  const { accessToken, user } = useAuth();
  const { pushToast } = useToast();
  const [showAmounts, setShowAmounts] = useState(true);
  const [showReflection, setShowReflection] = useState(false);
  const locale = user?.locale ?? "en";
  const userCurrency = user?.settings.baseCurrency ?? user?.settings.currency ?? "JPY";
  const localeCode = locale === "ja" ? "ja-JP" : "en-US";

  const summaryQuery = useQuery({
    queryKey: ["monthly", "summary", monthYear],
    enabled: Boolean(accessToken),
    queryFn: async () => {
      if (!accessToken) throw new Error("Not authenticated");
      return fetchMonthlySummary(accessToken, monthYear);
    },
  });

  const currency =
    (
      summaryQuery.data?.reflection?.summarySnapshot as
        | { currency?: string }
        | undefined
    )?.currency ?? userCurrency;

  const reflectionIntent = useMemo(() => {
    const answers = summaryQuery.data?.reflection?.monthlyAnswers ?? [];
    return answers[3]?.answer || "";
  }, [summaryQuery.data?.reflection?.monthlyAnswers]);
  const monthLabel = useMemo(() => formatMonthYearLabel(monthYear, locale), [monthYear, locale]);

  const createLinkMutation = useMutation({
    mutationFn: async () => {
      if (!accessToken) throw new Error("Not authenticated");
      return createShareCard(accessToken, {
        monthYear,
        showAmounts,
        showReflection,
      });
    },
    onSuccess: async (data) => {
      const link = `${window.location.origin}/share/${data.cardId}`;
      await navigator.clipboard.writeText(link);
      pushToast({ tone: "success", message: "Public share link copied." });
    },
  });

  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground">
      <div className="mx-auto w-full max-w-3xl space-y-8">
        <div className="flex items-start justify-between">
          <Link href="/monthly/archive" className="font-display text-[15px] tracking-[0.16em] text-muted-foreground">
            Archive
          </Link>
          <ThemeToggle />
        </div>

        <Card className="space-y-4">
          {summaryQuery.isLoading ? (
            <p className="font-sans text-sm text-muted-foreground">Loading monthly summary…</p>
          ) : summaryQuery.isError ? (
            <p className="font-sans text-sm text-enji">Could not load monthly summary.</p>
          ) : (
            <>
              <h1 className="font-display text-3xl tracking-[0.08em]">Monthly close for {monthLabel}</h1>
              <p className="font-sans text-sm text-muted-foreground">
                Monthly close summarizes the selected month (usually the previous month during the current month).
              </p>
              <div className="space-y-2 rounded-2xl border border-black/10 bg-white/55 px-5 py-4 dark:border-white/10 dark:bg-sumi/25">
                <p className="font-sans text-sm text-muted-foreground">Total spent</p>
                <p className="font-mono text-xl tabular-nums">
                  {formatMoney(summaryQuery.data?.reflection?.summarySnapshot?.totalSpent ?? 0, currency, localeCode)}
                </p>
                <p className="font-sans text-sm text-muted-foreground">
                  Income:{" "}
                  {formatMoney(summaryQuery.data?.reflection?.summarySnapshot?.income ?? 0, currency, localeCode)}
                </p>
                <p className="font-sans text-sm text-muted-foreground">
                  Next month target:{" "}
                  {formatMoney(summaryQuery.data?.goal?.savingsTarget ?? 0, currency, localeCode)}
                </p>
                <p className="font-sans text-sm text-muted-foreground">
                  Savings this close: {formatMoney(summaryQuery.data?.goal?.achieved ?? 0, currency, localeCode)}
                </p>
                {(summaryQuery.data?.reflection?.summarySnapshot?.entryCount ?? 0) === 0 ? (
                  <p className="font-sans text-sm text-muted-foreground">
                    No entries were recorded in this month, so totals are 0.
                  </p>
                ) : null}
              </div>

              <div className="space-y-3">
                {(summaryQuery.data?.reflection?.monthlyAnswers ?? []).map((qa, index) => (
                  <div
                    key={`${index}-${qa.questionEn}`}
                    className="rounded-2xl border border-black/10 bg-white/55 px-5 py-4 dark:border-white/10 dark:bg-sumi/25"
                  >
                    <p className="font-display text-sm tracking-[0.08em]">
                      {locale === "ja" ? qa.questionJa || qa.questionEn : qa.questionEn}
                    </p>
                    <p className="mt-2 font-sans text-sm leading-7 text-muted-foreground whitespace-pre-wrap">
                      {qa.answer}
                    </p>
                    {summaryQuery.data?.reflection?.monthlyAnswerHandwritingImages?.[index] ? (
                      <img
                        src={summaryQuery.data.reflection.monthlyAnswerHandwritingImages[index]}
                        alt={`Handwritten monthly answer ${index + 1}`}
                        className="mt-3 w-full rounded-xl border border-black/10 dark:border-white/10"
                      />
                    ) : null}
                  </div>
                ))}
              </div>

              <div className="space-y-4 rounded-2xl border border-black/10 bg-white/55 px-5 py-5 dark:border-white/10 dark:bg-sumi/25">
                <h2 className="font-display text-xl tracking-[0.08em]">Share card</h2>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <label className="inline-flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={showAmounts}
                      onChange={(e) => setShowAmounts(e.target.checked)}
                    />
                    Show amounts
                  </label>
                  <label className="inline-flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={showReflection}
                      onChange={(e) => setShowReflection(e.target.checked)}
                    />
                    Show my reflection
                  </label>
                </div>

                <div className="space-y-3">
                  <Button
                    type="button"
                    onClick={() => createLinkMutation.mutate()}
                    loading={createLinkMutation.isPending}
                  >
                    Create public link
                  </Button>
                </div>
              </div>
            </>
          )}
        </Card>

        <div className="rounded-2xl border border-dashed border-black/15 p-4 dark:border-white/20">
          <p className="mb-3 font-sans text-xs tracking-[0.18em] uppercase text-muted-foreground">Card preview</p>
          <div className="mx-auto w-full max-w-[360px]">
            <ShareMonthlyCard
              monthYear={monthYear}
              locale={locale}
              currency={currency}
              totalSpent={summaryQuery.data?.reflection?.summarySnapshot?.totalSpent ?? 0}
              byCategory={summaryQuery.data?.reflection?.summarySnapshot?.byCategory ?? {}}
              closingIntent={reflectionIntent}
              showAmounts={showAmounts}
              showReflection={showReflection}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
