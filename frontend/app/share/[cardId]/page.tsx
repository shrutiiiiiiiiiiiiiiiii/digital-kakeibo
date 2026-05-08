"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { use } from "react";
import { ShareMonthlyCard } from "@/components/ShareMonthlyCard";
import { Card } from "@/components/design-system/Card";
import { ThemeToggle } from "@/components/design-system/ThemeToggle";
import { fetchShareCard } from "@/lib/share-cards-api";

export default function ShareCardPage({ params }: { params: Promise<{ cardId: string }> }) {
  const { cardId } = use(params);
  const cardQuery = useQuery({
    queryKey: ["share-card", cardId],
    queryFn: async () => fetchShareCard(cardId),
  });

  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground">
      <div className="mx-auto w-full max-w-4xl space-y-8">
        <div className="flex items-start justify-between">
          <Link href="/" className="font-display text-[15px] tracking-[0.16em] text-muted-foreground">
            Home
          </Link>
          <ThemeToggle />
        </div>

        <Card className="space-y-4">
          <h1 className="font-display text-3xl tracking-[0.08em]">Shared monthly card</h1>
          {cardQuery.isLoading ? (
            <p className="font-sans text-sm text-muted-foreground">Loading card…</p>
          ) : cardQuery.isError || !cardQuery.data ? (
            <p className="font-sans text-sm text-enji">This card is not available.</p>
          ) : (
            <div className="mx-auto w-full max-w-[360px]">
              <ShareMonthlyCard
                monthYear={cardQuery.data.monthYear}
                locale={cardQuery.data.locale}
                currency={cardQuery.data.summarySnapshot?.currency ?? "JPY"}
                totalSpent={cardQuery.data.summarySnapshot?.totalSpent ?? 0}
                byCategory={cardQuery.data.summarySnapshot?.byCategory ?? {}}
                closingIntent={cardQuery.data.monthlyAnswers?.[3]?.answer || ""}
                showAmounts={cardQuery.data.showAmounts}
                showReflection={cardQuery.data.showReflection}
              />
            </div>
          )}
        </Card>
      </div>
    </main>
  );
}
