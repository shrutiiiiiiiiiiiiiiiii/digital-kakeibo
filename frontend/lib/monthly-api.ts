import { apiRequest } from "@/lib/api";
import type { MonthlyArchiveItem, MonthlyGoal, MonthlyStatus } from "@/lib/monthly";
import type { Reflection } from "@/lib/reflections";

export async function fetchMonthlyStatus(token: string, nowIso: string) {
  const query = new URLSearchParams({ now: nowIso });
  return apiRequest<MonthlyStatus>(`/monthly/status?${query.toString()}`, { token });
}

export async function skipMonthlyClose(token: string, body: { targetMonthYear: string }) {
  return apiRequest<{ ok: true; deferredUntil: string }>("/monthly/skip", {
    method: "POST",
    token,
    body,
  });
}

export async function createMonthlyClose(
  token: string,
  body: {
    targetMonthYear: string;
    answers: string[];
    handwritingAnswers?: string[];
    income: number;
    savingsTarget: number;
  }
) {
  return apiRequest<{ reflection: Reflection; goal: MonthlyGoal }>("/monthly/close", {
    method: "POST",
    token,
    body,
  });
}

export async function fetchMonthlyArchive(token: string) {
  return apiRequest<{ reflections: MonthlyArchiveItem[] }>("/monthly/archive", { token });
}

export async function fetchMonthlySummary(token: string, monthYear: string) {
  return apiRequest<{ reflection: MonthlyArchiveItem; goal: MonthlyGoal | null }>(`/monthly/${monthYear}`, {
    token,
  });
}
