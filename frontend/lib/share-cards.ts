import type { EntryCategory } from "@/lib/entries";

export type ShareCardPayload = {
  cardId: string;
  monthYear: string;
  showAmounts: boolean;
  showReflection: boolean;
  locale: "en" | "ja";
  summarySnapshot: {
    totalSpent?: number;
    currency?: string;
    byCategory?: Partial<Record<EntryCategory, number | { total?: number; count?: number }>>;
    savingsTarget?: number;
    income?: number;
  } | null;
  monthlyAnswers: Array<{
    questionEn?: string;
    questionJa?: string;
    answer?: string;
  }>;
  createdAt: string;
};
