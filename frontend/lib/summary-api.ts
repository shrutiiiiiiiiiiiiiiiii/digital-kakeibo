import { apiRequest } from "@/lib/api";
import type { EntryCategory } from "@/lib/entries";

export type WeekSummary = {
  period: { from: string; to: string };
  totalSpent: number;
  totalCount: number;
  byCategory: Record<EntryCategory, { total: number; count: number }>;
  byCurrency: Array<{
    currency: string;
    totalSpent: number;
    totalCount: number;
    byCategory: Record<EntryCategory, { total: number; count: number }>;
  }>;
};

export async function fetchWeekSummary(
  token: string,
  params: { from: string; to: string }
) {
  const query = new URLSearchParams(params);
  return apiRequest<WeekSummary>(`/summary/week?${query.toString()}`, { token });
}
