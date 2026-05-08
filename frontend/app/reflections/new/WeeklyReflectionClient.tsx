"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "@/components/design-system/Button";
import { Card } from "@/components/design-system/Card";
import { HandwritingPad } from "@/components/HandwritingPad";
import { Spacer } from "@/components/design-system/Spacer";
import { ThemeToggle } from "@/components/design-system/ThemeToggle";
import { useAuth } from "@/lib/auth";
import { getUserTimeZone, utcIsoRangeForCurrentLocalWeek, weekPeriodFromDate } from "@/lib/datetime";
import { formatMoney } from "@/lib/money";
import { createWeeklyReflection, fetchWeeklyReflectionContext } from "@/lib/reflections-api";
import type { EntryCategory } from "@/lib/entries";
import { useToast } from "@/lib/toast";

const CATS: EntryCategory[] = ["needs", "wants", "culture", "unexpected"];

export function WeeklyReflectionClient() {
  const { accessToken, user } = useAuth();
  const queryClient = useQueryClient();
  const { pushToast } = useToast();

  const timeZone = getUserTimeZone();
  const weekRange = useMemo(() => utcIsoRangeForCurrentLocalWeek(timeZone), [timeZone]);
  const period = useMemo(() => weekPeriodFromDate(new Date()), []);
  const locale = user?.locale ?? "en";
  const currency = user?.settings.baseCurrency ?? user?.settings.currency ?? "JPY";
  const localeCode = locale === "ja" ? "ja-JP" : "en-US";

  const contextQuery = useQuery({
    queryKey: ["reflections", "weekly", "current", { period, ...weekRange }],
    enabled: Boolean(accessToken),
    queryFn: async () => {
      if (!accessToken) throw new Error("Not authenticated");
      return fetchWeeklyReflectionContext(accessToken, {
        period,
        from: weekRange.fromUtc,
        to: weekRange.toUtc,
      });
    },
  });

  const [response, setResponse] = useState("");
  const [handwritingImage, setHandwritingImage] = useState("");
  const [inputMode, setInputMode] = useState<"text" | "handwrite">("text");

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!accessToken) throw new Error("Not authenticated");
      const text = response.trim();
      if (!text && !handwritingImage) throw new Error("Please write or handwrite a reflection first.");
      return createWeeklyReflection(accessToken, {
        period,
        from: weekRange.fromUtc,
        to: weekRange.toUtc,
        prompt: contextQuery.data?.prompt ?? "What surprised you this week?",
        response: text,
        handwritingImage: handwritingImage || undefined,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["reflections"] });
      await queryClient.invalidateQueries({ queryKey: ["reflections", "weekly", "current"] });
      pushToast({ tone: "success", message: "Reflection saved." });
    },
    onError: async (error) => {
      const message = error instanceof Error ? error.message : "Could not save reflection.";
      pushToast({ tone: "danger", message });
      if (message.toLowerCase().includes("already exists")) {
        await queryClient.invalidateQueries({ queryKey: ["reflections", "weekly", "current"] });
      }
    },
  });

  const byCategory = contextQuery.data?.summarySnapshot.byCategory ?? {
    needs: 0,
    wants: 0,
    culture: 0,
    unexpected: 0,
  };
  const total = contextQuery.data?.summarySnapshot.totalSpent ?? 0;
  const labels: Record<EntryCategory, string> = {
    needs: locale === "ja" ? "必要" : "Needs",
    wants: locale === "ja" ? "欲しい" : "Wants",
    culture: locale === "ja" ? "文化" : "Culture",
    unexpected: locale === "ja" ? "意外" : "Unexpected",
  };
  const colors: Record<EntryCategory, string> = {
    needs: "bg-sumi",
    wants: "bg-ai",
    culture: "bg-cha",
    unexpected: "bg-enji",
  };

  if (contextQuery.isLoading) {
    return (
      <main className="min-h-screen bg-background px-6 py-10 text-foreground">
        <p className="font-sans text-sm text-muted-foreground">Loading reflection…</p>
      </main>
    );
  }

  if (contextQuery.isError) {
    return (
      <main className="min-h-screen bg-background px-6 py-10 text-foreground">
        <p className="font-sans text-sm text-enji">Could not load reflection prompt.</p>
      </main>
    );
  }

  if (contextQuery.data?.reflection) {
    const reflection = contextQuery.data.reflection;
    return (
      <main className="min-h-screen bg-background px-6 py-10 text-foreground">
        <div className="mx-auto w-full max-w-3xl space-y-8">
          <div className="flex items-start justify-between">
            <Link href="/reflections" className="font-display text-[15px] tracking-[0.16em] text-muted-foreground">
              Back
            </Link>
            <ThemeToggle />
          </div>
          <Card className="space-y-5">
            <h1 className="font-display text-3xl tracking-[0.08em]">Weekly reflection already completed</h1>
            <p className="font-sans text-sm text-muted-foreground">{reflection.prompt}</p>
            <p className="font-sans text-[15px] leading-8 text-foreground whitespace-pre-wrap">
              {reflection.response}
            </p>
            {reflection.handwritingImage ? (
              <img
                src={reflection.handwritingImage}
                alt="Handwritten reflection"
                className="w-full rounded-2xl border border-black/10 dark:border-white/10"
              />
            ) : null}
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground">
      <div className="mx-auto w-full max-w-3xl space-y-8">
        <div className="flex items-start justify-between">
          <Link href="/dashboard" className="font-display text-[15px] tracking-[0.16em] text-muted-foreground">
            Dashboard
          </Link>
          <ThemeToggle />
        </div>

        <Card className="space-y-8">
          <div className="space-y-3">
            <p className="font-sans text-xs font-semibold tracking-[0.28em] uppercase text-muted-foreground">
              Weekly reflection
            </p>
            <p className="font-mono text-sm tabular-nums text-muted-foreground">{period}</p>
          </div>

          <div className="space-y-3">
            <div className="flex items-end justify-between">
              <p className="font-sans text-sm text-muted-foreground">This week total</p>
              <p className="font-mono text-2xl tabular-nums">{formatMoney(total, currency, localeCode)}</p>
            </div>
            <div className="overflow-hidden rounded-full border border-black/10 bg-black/5 dark:border-white/10 dark:bg-white/10">
              <div className="flex h-5 w-full">
                {CATS.map((cat) => {
                  const amount = byCategory[cat] ?? 0;
                  const pct = total > 0 ? (amount / total) * 100 : 0;
                  return (
                    <div
                      key={cat}
                      className={[colors[cat], "transition-[width] duration-300"].join(" ")}
                      style={{ width: `${pct}%`, minWidth: amount > 0 ? 6 : 0 }}
                      title={`${labels[cat]} ${formatMoney(amount, currency, localeCode)}`}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h1 className="font-display text-3xl tracking-[0.08em] leading-tight">
              {contextQuery.data?.prompt}
            </h1>
            <div className="flex gap-3">
              <Button type="button" onClick={() => setInputMode("text")}>
                Type
              </Button>
              <Button type="button" onClick={() => setInputMode("handwrite")}>
                Handwrite
              </Button>
            </div>
            {inputMode === "text" ? (
              <textarea
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                rows={10}
                className="w-full rounded-2xl border border-black/15 bg-white/60 px-5 py-4 font-sans text-[15px] leading-8 text-foreground outline-none transition focus:border-enji dark:border-white/10 dark:bg-sumi/30"
                placeholder={locale === "ja" ? "今週の気づきを静かに書いてください…" : "Write your reflection quietly…"}
              />
            ) : (
              <HandwritingPad value={handwritingImage} onChange={setHandwritingImage} />
            )}
          </div>

          <Spacer size="sm" />
          <Button type="button" onClick={() => createMutation.mutate()} loading={createMutation.isPending}>
            Save reflection
          </Button>
        </Card>
      </div>
    </main>
  );
}
