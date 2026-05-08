import { apiRequest } from "@/lib/api";
import type { Reflection, WeeklyReflectionContext } from "@/lib/reflections";

export async function fetchWeeklyReflectionContext(
  token: string,
  params: { period: string; from: string; to: string }
) {
  const query = new URLSearchParams(params);
  return apiRequest<WeeklyReflectionContext>(`/reflections/weekly/current?${query.toString()}`, {
    token,
  });
}

export async function createWeeklyReflection(
  token: string,
  body: {
    period: string;
    from: string;
    to: string;
    prompt: string;
    response: string;
    handwritingImage?: string;
  }
) {
  return apiRequest<{ reflection: Reflection }>("/reflections/weekly", {
    method: "POST",
    token,
    body,
  });
}

export async function listWeeklyReflections(token: string) {
  return apiRequest<{ reflections: Reflection[] }>("/reflections?type=weekly", {
    token,
  });
}

export async function updateReflectionResponse(
  token: string,
  reflectionId: string,
  response: string,
  handwritingImage?: string
) {
  return apiRequest<{ reflection: Reflection }>(`/reflections/${reflectionId}`, {
    method: "PATCH",
    token,
    body: { response, handwritingImage },
  });
}
