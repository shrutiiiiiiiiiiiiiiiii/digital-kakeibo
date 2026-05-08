import { apiRequest } from "@/lib/api";
import type { EntriesResponse, Entry, EntryCategory, EntryResponse } from "@/lib/entries";

function withQuery(path: string, query: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value) params.set(key, value);
  }
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

export async function fetchEntries(
  token: string,
  params: { from?: string; to?: string; category?: string }
) {
  return apiRequest<EntriesResponse>(withQuery("/entries", params), { token });
}

export async function fetchEntry(token: string, id: string) {
  return apiRequest<EntryResponse>(`/entries/${id}`, { token });
}

export async function createEntry(
  token: string,
  body: {
    amount: number;
    currency?: string;
    category: EntryCategory;
    note?: string;
    noteHandwritingImage?: string;
    date?: string;
  }
) {
  return apiRequest<EntryResponse>("/entries", {
    method: "POST",
    token,
    body,
  });
}

export async function updateEntry(
  token: string,
  id: string,
  body: Partial<Pick<Entry, "amount" | "currency" | "category" | "note" | "noteHandwritingImage" | "date">>
) {
  return apiRequest<EntryResponse>(`/entries/${id}`, {
    method: "PATCH",
    token,
    body,
  });
}

export async function deleteEntry(token: string, id: string) {
  return apiRequest<{ ok: boolean; entry: Entry }>(`/entries/${id}`, {
    method: "DELETE",
    token,
  });
}
