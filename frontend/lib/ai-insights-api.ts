import { apiRequest } from "@/lib/api";

export type WeeklyAiInsights = {
  insight: string;
  currency: string;
  period: { from: string; to: string };
};

export async function fetchWeeklyAiInsights(
  token: string,
  params: { from: string; to: string }
) {
  const query = new URLSearchParams(params);
  return apiRequest<WeeklyAiInsights>(`/ai/insights/weekly?${query.toString()}`, { token });
}

