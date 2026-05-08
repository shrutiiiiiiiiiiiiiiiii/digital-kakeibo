import { API_BASE_URL, apiRequest } from "@/lib/api";
import type { ShareCardPayload } from "@/lib/share-cards";

export async function createShareCard(
  token: string,
  body: { monthYear: string; showAmounts: boolean; showReflection: boolean }
) {
  return apiRequest<{ cardId: string }>("/share-cards", {
    method: "POST",
    token,
    body,
  });
}

export async function fetchShareCard(cardId: string) {
  const response = await fetch(`${API_BASE_URL}/share-cards/${cardId}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = typeof data?.message === "string" ? data.message : "Request failed";
    throw new Error(message);
  }
  return data as ShareCardPayload;
}
