"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Card } from "@/components/design-system/Card";
import { ThemeToggle } from "@/components/design-system/ThemeToggle";
import { useAuth } from "@/lib/auth";
import { fetchMonthlyArchive } from "@/lib/monthly-api";

function formatMonthYearLabel(monthYear: string) {
  const [yearText, monthText] = monthYear.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) return monthYear;
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(Date.UTC(year, month - 1, 1))
  );
}

export default function MonthlyArchivePage() {
  const { accessToken } = useAuth();
  const archiveQuery = useQuery({
    queryKey: ["monthly", "archive"],
    enabled: Boolean(accessToken),
    queryFn: async () => {
      if (!accessToken) throw new Error("Not authenticated");
      return fetchMonthlyArchive(accessToken);
    },
  });

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
          <h1 className="font-display text-3xl tracking-[0.08em]">Monthly archive</h1>
          <p className="font-sans text-sm text-muted-foreground">
            Each item is the month being closed (for example, in May you usually close April).
          </p>
          {archiveQuery.isLoading ? (
            <p className="font-sans text-sm text-muted-foreground">Loading archive…</p>
          ) : archiveQuery.isError ? (
            <p className="font-sans text-sm text-enji">Could not load archive.</p>
          ) : (archiveQuery.data?.reflections?.length ?? 0) === 0 ? (
            <p className="font-sans text-sm text-muted-foreground">No monthly closings yet.</p>
          ) : (
            <div className="space-y-3">
              {archiveQuery.data?.reflections.map((item) => (
                <Link
                  key={item._id}
                  href={`/monthly/${item.period}`}
                  className="flex items-center justify-between rounded-2xl border border-black/10 bg-white/55 px-5 py-4 text-sm transition hover:-translate-y-0.5 dark:border-white/10 dark:bg-sumi/25"
                >
                  <span className="font-display tracking-[0.1em]">{formatMonthYearLabel(item.period)}</span>
                  <span className="font-sans text-muted-foreground">Open</span>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>
    </main>
  );
}
