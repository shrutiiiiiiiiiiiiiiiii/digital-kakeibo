"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Button } from "@/components/design-system/Button";
import { Card } from "@/components/design-system/Card";
import { HandwritingPad } from "@/components/HandwritingPad";
import { ThemeToggle } from "@/components/design-system/ThemeToggle";
import { useAuth } from "@/lib/auth";
import { createMonthlyClose, fetchMonthlyStatus } from "@/lib/monthly-api";
import type { MonthlyQuestion } from "@/lib/monthly";
import { useToast } from "@/lib/toast";

const DEFAULT_QUESTIONS: MonthlyQuestion[] = [
  {
    en: "What spending choice are you most proud of this month?",
    ja: "今月、いちばん良かったお金の使い方は？",
  },
  {
    en: "Where did your spending drift from your intention?",
    ja: "意図からズレた支出はどこでしたか？",
  },
  {
    en: "What pattern do you want to carry into next month?",
    ja: "来月に持ち越したい支出パターンは？",
  },
  {
    en: "What one small rule will guide your next month?",
    ja: "来月のために決める小さなルールは？",
  },
];

export function MonthlyCloseClient() {
  const { accessToken, user } = useAuth();
  const queryClient = useQueryClient();
  const { pushToast } = useToast();
  const router = useRouter();
  const locale = user?.locale ?? "en";

  const statusQuery = useQuery({
    queryKey: ["monthly", "status"],
    enabled: Boolean(accessToken),
    queryFn: async () => {
      if (!accessToken) throw new Error("Not authenticated");
      return fetchMonthlyStatus(accessToken, new Date().toISOString());
    },
  });

  const questions = useMemo(
    () => (statusQuery.data?.questions?.length === 4 ? statusQuery.data.questions : DEFAULT_QUESTIONS),
    [statusQuery.data?.questions]
  );

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>(["", "", "", ""]);
  const [handwritingAnswers, setHandwritingAnswers] = useState<string[]>(["", "", "", ""]);
  const [inputMode, setInputMode] = useState<"text" | "handwrite">("text");
  const [income, setIncome] = useState("");
  const [savingsTarget, setSavingsTarget] = useState("");

  const currentQuestion = questions[step];
  const isLastQuestion = step === 3;
  const canContinue = answers[step]?.trim().length > 0 || Boolean(handwritingAnswers[step]);
  const canSubmit =
    answers.every((a, idx) => a.trim().length > 0 || Boolean(handwritingAnswers[idx])) &&
    income.trim().length > 0 &&
    savingsTarget.trim().length > 0 &&
    Number(income) >= 0 &&
    Number(savingsTarget) >= 0;

  const closeMutation = useMutation({
    mutationFn: async () => {
      if (!accessToken) throw new Error("Not authenticated");
      const targetMonthYear = statusQuery.data?.targetMonthYear;
      if (!targetMonthYear) throw new Error("No month available to close.");
      return createMonthlyClose(accessToken, {
        targetMonthYear,
        answers: answers.map((a) => a.trim()),
        handwritingAnswers,
        income: Number(income),
        savingsTarget: Number(savingsTarget),
      });
    },
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ["monthly"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      pushToast({ tone: "success", message: "Monthly close saved." });
      router.push(`/monthly/${data.reflection.period}`);
    },
    onError: (error) => {
      pushToast({
        tone: "danger",
        message: error instanceof Error ? error.message : "Could not save monthly close.",
      });
    },
  });

  if (statusQuery.isLoading) {
    return (
      <main className="min-h-screen bg-background px-6 py-10 text-foreground">
        <p className="font-sans text-sm text-muted-foreground">Loading monthly ritual…</p>
      </main>
    );
  }

  if (statusQuery.isError) {
    return (
      <main className="min-h-screen bg-background px-6 py-10 text-foreground">
        <p className="font-sans text-sm text-enji">Could not load monthly ritual.</p>
      </main>
    );
  }

  if (!statusQuery.data?.shouldPrompt) {
    return (
      <main className="min-h-screen bg-background px-6 py-10 text-foreground">
        <div className="mx-auto w-full max-w-3xl space-y-8">
          <div className="flex items-start justify-between">
            <Link href="/dashboard" className="font-display text-[15px] tracking-[0.16em] text-muted-foreground">
              Dashboard
            </Link>
            <ThemeToggle />
          </div>
          <Card className="space-y-4">
            <h1 className="font-display text-3xl tracking-[0.08em]">Monthly ritual is not due right now</h1>
            <p className="font-sans text-sm text-muted-foreground">
              You can always review previous closings from archive.
            </p>
            <Link href="/monthly/archive" className="font-sans text-sm underline underline-offset-4">
              Open archive
            </Link>
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

        <Card className="space-y-6">
          <p className="font-sans text-xs font-semibold tracking-[0.28em] uppercase text-muted-foreground">
            Monthly close {statusQuery.data.targetMonthYear}
          </p>

          <h1 className="font-display text-3xl tracking-[0.08em] leading-tight">
            {locale === "ja" ? currentQuestion.ja : currentQuestion.en}
          </h1>

          <div className="flex gap-3">
            <Button type="button" onClick={() => setInputMode("text")}>
              Type
            </Button>
            <Button type="button" onClick={() => setInputMode("handwrite")}>
              Handwrite
            </Button>
          </div>
          <div className="mt-2">
            {inputMode === "text" ? (
              <textarea
                value={answers[step]}
                onChange={(e) => {
                  const next = [...answers];
                  next[step] = e.target.value;
                  setAnswers(next);
                }}
                rows={8}
                className="w-full rounded-2xl border border-black/15 bg-white/60 px-5 py-4 font-sans text-[15px] leading-8 text-foreground outline-none transition focus:border-enji dark:border-white/10 dark:bg-sumi/30"
                placeholder={locale === "ja" ? "ここに書いてください…" : "Write your answer…"}
              />
            ) : (
              <HandwritingPad
                value={handwritingAnswers[step] || ""}
                onChange={(dataUrl) => {
                  const next = [...handwritingAnswers];
                  next[step] = dataUrl;
                  setHandwritingAnswers(next);
                }}
              />
            )}
          </div>

          {isLastQuestion ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <p className="font-sans text-sm text-muted-foreground">Monthly income</p>
                <input
                  value={income}
                  onChange={(e) => setIncome(e.target.value)}
                  inputMode="decimal"
                  className="w-full rounded-xl border border-black/15 bg-white/60 px-4 py-3 font-mono text-sm dark:border-white/10 dark:bg-sumi/30"
                />
              </div>
              <div className="space-y-2">
                <p className="font-sans text-sm text-muted-foreground">Savings target (next month)</p>
                <input
                  value={savingsTarget}
                  onChange={(e) => setSavingsTarget(e.target.value)}
                  inputMode="decimal"
                  className="w-full rounded-xl border border-black/15 bg-white/60 px-4 py-3 font-mono text-sm dark:border-white/10 dark:bg-sumi/30"
                />
              </div>
            </div>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              type="button"
              onClick={() => {
                if (isLastQuestion) {
                  closeMutation.mutate();
                  return;
                }
                setStep((prev) => Math.min(prev + 1, 3));
              }}
              disabled={isLastQuestion ? !canSubmit : !canContinue}
              loading={closeMutation.isPending}
            >
              {isLastQuestion ? "Finish monthly close" : "Next"}
            </Button>
            {step > 0 ? (
              <Button type="button" onClick={() => setStep((prev) => Math.max(prev - 1, 0))}>
                Back
              </Button>
            ) : null}
          </div>
        </Card>
      </div>
    </main>
  );
}
