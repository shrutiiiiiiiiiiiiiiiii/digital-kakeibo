import type { Reflection } from "@/lib/reflections";

export type MonthlyQuestion = {
  en: string;
  ja: string;
};

export type MonthlyStatus = {
  shouldPrompt: boolean;
  targetMonthYear?: string;
  reason?: "already_completed" | "deferred";
  deferredUntil?: string;
  questions?: MonthlyQuestion[];
};

export type MonthlyGoal = {
  _id: string;
  monthYear: string;
  savingsTarget: number;
  achieved: number;
  reflectionId?: string;
};

export type MonthlyArchiveItem = Reflection & {
  monthlyAnswers?: Array<{
    questionEn?: string;
    questionJa?: string;
    answer?: string;
  }>;
};
