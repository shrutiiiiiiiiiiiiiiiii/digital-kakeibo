"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Card } from "@/components/design-system/Card";
import { Spacer } from "@/components/design-system/Spacer";
import { ThemeToggle } from "@/components/design-system/ThemeToggle";
import { useAuth } from "@/lib/auth";
import { listWeeklyReflections } from "@/lib/reflections-api";

export default function ReflectionsHistoryPage() {
  const { accessToken } = useAuth();

  const reflectionsQuery = useQuery({
    queryKey: ["reflections", "weekly", "list"],
    enabled: Boolean(accessToken),
    queryFn: async () => {
      if (!accessToken) throw new Error("Not authenticated");
      return listWeeklyReflections(accessToken);
    },
  });

  const reflections = reflectionsQuery.data?.reflections ?? [];

  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground">
      <div className="mx-auto w-full max-w-3xl space-y-8">
        <div className="flex items-start justify-between gap-6">
          <div className="space-y-3">
            <Link href="/dashboard" className="font-display text-[15px] tracking-[0.16em] text-muted-foreground">
              Dashboard
            </Link>
            <h1 className="font-display text-3xl tracking-[0.08em]">Reflections</h1>
          </div>
          <ThemeToggle />
        </div>

        <div className="flex justify-end">
          <Link
            href="/reflections/new"
            className="inline-flex min-h-[60px] items-center justify-center rounded-xl border border-sumi bg-kinari px-6 font-display text-[15px] tracking-[0.08em] text-sumi shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            New weekly reflection
          </Link>
        </div>

        <Spacer size="sm" />

        {reflectionsQuery.isLoading ? (
          <p className="font-sans text-sm text-muted-foreground">Loading reflections…</p>
        ) : reflectionsQuery.isError ? (
          <p className="font-sans text-sm text-enji">Could not load reflections.</p>
        ) : reflections.length === 0 ? (
          <Card>
            <p className="font-display text-lg tracking-[0.08em]">No reflections yet</p>
            <p className="mt-2 font-sans text-sm leading-7 text-muted-foreground">
              Your weekly reflections will appear here in chronological order.
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {reflections.map((r) => (
              <Card key={r._id} className="space-y-4">
                <div className="flex items-end justify-between gap-4">
                  <p className="font-display text-lg tracking-[0.08em]">{r.period}</p>
                  <p className="font-sans text-xs text-muted-foreground">
                    {new Date(r.createdAt).toLocaleString()}
                  </p>
                </div>
                <p className="font-sans text-sm text-muted-foreground">{r.prompt}</p>
                {r.response && r.response !== "[Handwritten reflection]" ? (
                  <p className="font-sans text-[15px] leading-8 whitespace-pre-wrap">{r.response}</p>
                ) : null}
                {r.handwritingImage ? (
                  <img
                    src={r.handwritingImage}
                    alt="Handwritten reflection"
                    className="w-full rounded-2xl border border-black/10 dark:border-white/10"
                  />
                ) : null}
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
