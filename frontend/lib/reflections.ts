import type { EntryCategory } from "@/lib/entries";

export type ReflectionType = "weekly" | "monthly";

export type Reflection = {
  _id: string;
  userId: string;
  type: ReflectionType;
  period: string;
  prompt: string;
  response: string;
  handwritingImage?: string | null;
  summarySnapshot: {
    totalSpent: number;
    byCategory: Record<EntryCategory, number>;
    income?: number;
    savingsTarget?: number;
    entryCount?: number;
    fromUtc?: string;
    toUtc?: string;
  };
  monthlyAnswers?: Array<{
    questionEn?: string;
    questionJa?: string;
    answer?: string;
  }>;
  monthlyAnswerHandwritingImages?: string[];
  createdAt: string;
};

export type WeeklyReflectionContext = {
  period: string;
  prompt: string;
  reflection: Reflection | null;
  summarySnapshot: {
    totalSpent: number;
    byCategory: Record<EntryCategory, number>;
  };
};
