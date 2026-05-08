import Link from "next/link";
import type { Metadata } from "next";
import { Card } from "@/components/design-system/Card";
import { Spacer } from "@/components/design-system/Spacer";
import { ThemeToggle } from "@/components/design-system/ThemeToggle";
import { FinalAuthCta, HeroAuthCtas } from "@/components/home/AuthCtas";

export const metadata: Metadata = {
  title: "Mindful money since 1904",
  description: "A digital kakeibo, faithful to the original mindful money practice.",
};

export default function Home() {
  const pillars = [
    {
      title: "Capture gently",
      description: "Add expenses in seconds with clear categories and optional handwriting notes.",
    },
    {
      title: "Reflect weekly",
      description: "See where money goes and get short AI insight prompts for better decisions.",
    },
    {
      title: "Close monthly",
      description: "Finish each month with a simple ritual that keeps your budget intentional.",
    },
  ];

  const highlights = [
    "Beautiful dark/light experience",
    "Mindful Japanese-inspired interface",
    "Built for consistency, not guilt",
  ];

  const kakeiboQuestions = [
    "How much money do you have available?",
    "How much would you like to save?",
    "How much are you spending?",
    "How can you improve next month?",
  ];

  const categoryGuide = [
    { name: "Needs", detail: "Essentials like rent, groceries, transport, and utilities." },
    { name: "Wants", detail: "Lifestyle spending such as shopping, dining out, and subscriptions." },
    { name: "Culture", detail: "Learning and enrichment: books, classes, art, and experiences." },
    { name: "Unexpected", detail: "Unplanned costs: repairs, medical bills, gifts, and emergencies." },
  ];

  return (
    <div className="kakeibo-shell min-h-screen bg-background px-6 py-10 text-foreground">
      <div className="mx-auto flex w-full max-w-6xl items-start justify-between gap-6">
        <p className="max-w-sm font-sans text-xs font-medium tracking-[0.28em] uppercase text-muted-foreground">
          Mindful money since 1904
        </p>
        <ThemeToggle />
      </div>

      <Spacer size="md" />

      <main className="mx-auto w-full max-w-6xl space-y-6">
        <Card className="kakeibo-panel relative overflow-hidden p-7 sm:p-10">
          <div className="pointer-events-none absolute -left-8 -top-8 h-36 w-36 rounded-full bg-enji/25 blur-3xl dark:bg-enji/35" />
          <div className="pointer-events-none absolute -bottom-10 right-0 h-44 w-44 rounded-full bg-ai/25 blur-3xl dark:bg-ai/35" />

          <div className="relative grid gap-10 lg:grid-cols-2 lg:items-center">
            <div className="space-y-6">
              <span className="inline-flex rounded-full border border-black/10 bg-[#fff9f1] px-3 py-1 font-sans text-[11px] tracking-[0.16em] uppercase text-muted-foreground shadow-sm dark:border-white/10 dark:bg-white/5">
                Digital ritual for modern budgeting
              </span>
              <h1 className="font-display text-4xl leading-tight tracking-[0.05em] sm:text-6xl">
                Digital Kakeibo
              </h1>
              <p className="max-w-xl font-sans text-[17px] leading-8 text-black/65 dark:text-muted-foreground">
                Make budgeting calm, beautiful, and consistent. Track daily spending, reflect weekly, and close each month with confidence.
              </p>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <HeroAuthCtas />
              </div>

              <div className="flex flex-wrap gap-2">
                {highlights.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-black/10 bg-[#fffaf3] px-3 py-1 font-sans text-xs text-black/65 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-muted-foreground"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid gap-3">
              <div className="rounded-2xl border border-[#bba88c]/45 bg-gradient-to-br from-[#fff8ee] to-[#f5eadb] p-5 shadow-[0_10px_26px_-18px_rgba(120,90,55,0.45)] backdrop-blur-sm dark:border-white/10 dark:bg-gradient-to-br dark:from-[#2a2d34] dark:to-[#1f2228] dark:shadow-[0_14px_28px_-20px_rgba(0,0,0,0.8)]">
                <p className="font-sans text-xs uppercase tracking-[0.15em] text-muted-foreground dark:text-washi/70">Weekly overview</p>
                <p className="mt-2 font-mono text-3xl tabular-nums text-sumi dark:text-washi">¥12,480</p>
                <p className="mt-1 font-sans text-sm text-black/60 dark:text-washi/70">Balanced across Needs, Wants, Culture, and Unexpected</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-[#ccbba0]/45 bg-[#fffbf5] p-4 shadow-[0_10px_18px_-16px_rgba(120,90,55,0.5)] dark:border-white/10 dark:bg-white/5 dark:shadow-none">
                  <p className="font-sans text-xs uppercase tracking-[0.15em] text-muted-foreground dark:text-washi/70">Streak</p>
                  <p className="mt-2 font-mono text-2xl tabular-nums text-sumi dark:text-washi">17 days</p>
                </div>
                <div className="rounded-2xl border border-[#ccbba0]/45 bg-[#fffbf5] p-4 shadow-[0_10px_18px_-16px_rgba(120,90,55,0.5)] dark:border-white/10 dark:bg-white/5 dark:shadow-none">
                  <p className="font-sans text-xs uppercase tracking-[0.15em] text-muted-foreground dark:text-washi/70">Reflection ready</p>
                  <p className="mt-2 font-mono text-2xl tabular-nums text-sumi dark:text-washi">Sunday</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <section className="grid gap-4 md:grid-cols-3">
          {pillars.map((pillar) => (
            <Card key={pillar.title} className="kakeibo-panel p-6">
              <p className="font-display text-lg tracking-[0.05em]">{pillar.title}</p>
              <p className="mt-3 font-sans text-sm leading-7 text-muted-foreground">{pillar.description}</p>
            </Card>
          ))}
        </section>

        <Card className="kakeibo-panel p-7 sm:p-10">
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="space-y-4">
              <p className="font-sans text-xs font-semibold tracking-[0.2em] uppercase text-muted-foreground">
                What is Kakeibo?
              </p>
              <h2 className="font-display text-3xl tracking-[0.04em] sm:text-4xl">The Japanese method for mindful money</h2>
              <p className="font-sans text-[15px] leading-8 text-muted-foreground">
                Kakeibo (pronounced kah-keh-boh) is a Japanese budgeting practice created in 1904 by journalist
                Hani Motoko. Instead of only tracking numbers, it helps you build awareness about your choices and
                align spending with your values.
              </p>
              <p className="font-sans text-[15px] leading-8 text-muted-foreground">
                The method combines intentional planning, daily recording, and weekly/monthly reflection so saving
                becomes a calm habit, not a stressful task.
              </p>
            </div>

            <div className="space-y-3">
              <p className="font-display text-lg tracking-[0.06em]">The 4 Kakeibo reflection questions</p>
              <div className="space-y-2">
                {kakeiboQuestions.map((question, index) => (
                  <div
                    key={question}
                    className="rounded-2xl border border-black/10 bg-white/65 px-4 py-3 dark:border-white/10 dark:bg-sumi/30"
                  >
                    <p className="font-sans text-sm leading-7 text-muted-foreground">
                      <span className="mr-2 font-mono text-foreground">{index + 1}.</span>
                      {question}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <section className="grid gap-4 lg:grid-cols-2">
          <Card className="kakeibo-panel p-7">
            <p className="font-display text-2xl tracking-[0.05em]">Traditional spending categories</p>
            <p className="mt-2 font-sans text-sm leading-7 text-muted-foreground">
              Kakeibo groups expenses into four clear buckets, making patterns easier to understand.
            </p>
            <div className="mt-5 grid gap-3">
              {categoryGuide.map((category) => (
                <div
                  key={category.name}
                  className="rounded-2xl border border-black/10 bg-white/60 px-4 py-3 dark:border-white/10 dark:bg-sumi/30"
                >
                  <p className="font-display text-sm tracking-[0.08em]">{category.name}</p>
                  <p className="mt-1 font-sans text-sm leading-6 text-muted-foreground">{category.detail}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="kakeibo-panel p-7">
            <p className="font-display text-2xl tracking-[0.05em]">How Digital Kakeibo helps</p>
            <div className="mt-4 space-y-3 font-sans text-sm leading-7 text-muted-foreground">
              <p>
                <span className="font-medium text-foreground">Daily entries:</span> Quickly record expenses with
                category, note, and optional handwriting.
              </p>
              <p>
                <span className="font-medium text-foreground">Weekly reflection:</span> Review totals and generate AI
                insights to improve the next week.
              </p>
              <p>
                <span className="font-medium text-foreground">Monthly close:</span> Run a guided ritual to review your
                month and set your next savings intention.
              </p>
              <p>
                <span className="font-medium text-foreground">Long-term clarity:</span> Build awareness and confidence
                with a consistent, gentle rhythm.
              </p>
            </div>
          </Card>
        </section>

        <Card className="kakeibo-panel p-6 sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <p className="font-display text-2xl tracking-[0.05em]">Start your mindful money ritual today</p>
              <p className="font-sans text-sm leading-7 text-muted-foreground">
                Join Digital Kakeibo and turn everyday spending into intentional choices.
              </p>
            </div>
            <FinalAuthCta />
          </div>
        </Card>

      </main>
    </div>
  );
}
