"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Card } from "@/components/design-system/Card";
import { Modal } from "@/components/design-system/Modal";
import { Spacer } from "@/components/design-system/Spacer";
import { ThemeToggle } from "@/components/design-system/ThemeToggle";
import { useAuth } from "@/lib/auth";
import { formatDayHeadingFromLocalYmd, getUserTimeZone, utcIsoRangeForLocalDays } from "@/lib/datetime";
import { createEntry, deleteEntry, fetchEntries } from "@/lib/entries-api";
import type { Entry } from "@/lib/entries";
import { formatMoney } from "@/lib/money";
import { useToast } from "@/lib/toast";

function groupKeyForEntry(entry: Entry, timeZone: string) {
  const d = new Date(entry.date);
  // yyyy-MM-dd in user's timezone for stable grouping
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}

export default function EntriesPage() {
  const { accessToken, user } = useAuth();
  const queryClient = useQueryClient();
  const { pushToast } = useToast();

  const timeZone = useMemo(() => getUserTimeZone(), []);
  const locale = user?.locale ?? "en";
  const currency = user?.settings.baseCurrency ?? user?.settings.currency ?? "JPY";

  const range = useMemo(() => {
    return utcIsoRangeForLocalDays({
      anchor: new Date(),
      pastDays: 120,
      futureDays: 7,
      timeZone,
    });
  }, [timeZone]);

  const entriesQuery = useQuery({
    queryKey: ["entries", { from: range.fromUtc, to: range.toUtc }],
    enabled: Boolean(accessToken),
    queryFn: async () => {
      if (!accessToken) throw new Error("Not authenticated");
      return fetchEntries(accessToken, { from: range.fromUtc, to: range.toUtc });
    },
  });

  const grouped = useMemo(() => {
    const map = new Map<string, Entry[]>();
    for (const entry of entriesQuery.data?.entries ?? []) {
      const key = groupKeyForEntry(entry, timeZone);
      const list = map.get(key) ?? [];
      list.push(entry);
      map.set(key, list);
    }
    const keys = Array.from(map.keys()).sort((a, b) => (a < b ? 1 : -1));
    return keys.map((k) => ({ key: k, entries: map.get(k) ?? [] }));
  }, [entriesQuery.data?.entries, timeZone]);

  const [pendingDelete, setPendingDelete] = useState<Entry | null>(null);

  const deleteMutation = useMutation({
    mutationFn: async (entry: Entry) => {
      if (!accessToken) throw new Error("Not authenticated");
      return deleteEntry(accessToken, entry._id);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["entries"] });
    },
  });

  return (
    <div className="kakeibo-shell min-h-screen bg-background px-6 py-10 text-foreground">
      <div className="mx-auto flex w-full max-w-3xl items-start justify-between gap-6">
        <div className="space-y-3">
          <Link href="/dashboard" className="font-display text-[15px] tracking-[0.16em] text-muted-foreground">
            Dashboard
          </Link>
          <h1 className="font-display text-3xl tracking-[0.08em]">Entries</h1>
        </div>
        <ThemeToggle />
      </div>

      <Spacer size="lg" />

      <div className="mx-auto flex w-full max-w-3xl justify-end">
        <Link
          href="/entries/new"
          className="inline-flex min-h-[60px] items-center justify-center rounded-full border border-sumi bg-kinari px-6 font-display text-2xl leading-none text-sumi shadow-lg transition hover:-translate-y-0.5"
          aria-label="Add entry"
        >
          +
        </Link>
      </div>

      <Spacer size="md" />

      <div className="mx-auto w-full max-w-3xl space-y-10">
        {entriesQuery.isLoading ? (
          <p className="font-sans text-sm text-muted-foreground">Loading entries…</p>
        ) : entriesQuery.isError ? (
          <p className="font-sans text-sm text-enji">Could not load entries.</p>
        ) : grouped.length === 0 ? (
          <Card className="kakeibo-panel">
            <p className="font-sans text-[15px] leading-7 text-muted-foreground">
              No entries yet. Tap <span className="font-semibold text-foreground">+</span> to record your first mindful spend.
            </p>
          </Card>
        ) : (
          grouped.map((group) => (
            <section key={group.key} className="space-y-4">
              <p className="font-display text-[15px] tracking-[0.14em] text-muted-foreground">
                {formatDayHeadingFromLocalYmd(group.key, locale, timeZone)}
              </p>

              <div className="space-y-3">
                {group.entries.map((entry) => (
                  <Card key={entry._id} className="kakeibo-panel p-8">
                    <div className="flex items-start justify-between gap-6">
                      <div className="space-y-2">
                        <p className="font-mono text-2xl tabular-nums tracking-tight">
                          {formatMoney(entry.amount, entry.currency || currency, locale === "ja" ? "ja-JP" : "en-US")}
                        </p>
                        <p className="inline-flex rounded-full border border-black/10 bg-white/45 px-2.5 py-1 font-display text-xs tracking-[0.18em] text-muted-foreground dark:border-white/10 dark:bg-white/5">
                          {entry.category}
                        </p>
                        {entry.note ? (
                          <p className="font-sans text-sm leading-6 text-muted-foreground">{entry.note}</p>
                        ) : null}
                        {entry.noteHandwritingImage ? (
                          <img
                            src={entry.noteHandwritingImage}
                            alt="Handwritten note"
                            className="w-full max-w-xs rounded-xl border border-black/10 dark:border-white/10"
                          />
                        ) : null}
                      </div>

                      <div className="flex shrink-0 flex-col gap-3">
                        <Link
                          href={`/entries/${entry._id}/edit`}
                          className="rounded-xl border border-black/15 bg-white/60 px-4 py-2 text-center font-display text-sm tracking-[0.12em] text-sumi shadow-sm backdrop-blur-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-sumi/30 dark:text-washi"
                        >
                          Edit
                        </Link>
                        <button
                          type="button"
                          className="rounded-xl border border-enji/30 bg-washi px-4 py-2 font-display text-sm tracking-[0.12em] text-enji shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                          onClick={() => setPendingDelete(entry)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          ))
        )}
      </div>

      <Modal
        isOpen={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        title="Delete this entry?"
        description="This removes the record from your journal. You can undo for a moment after deleting."
        primaryAction={{
          label: deleteMutation.isPending ? "Deleting…" : "Delete",
          onClick: async () => {
            if (!pendingDelete) return;
            const snapshot = pendingDelete;
            setPendingDelete(null);
            try {
              await deleteMutation.mutateAsync(snapshot);
              pushToast({
                tone: "danger",
                message: "Entry deleted.",
                actionLabel: "Undo",
                onAction: async () => {
                  if (!accessToken) return;
                  await createEntry(accessToken, {
                    amount: snapshot.amount,
                    category: snapshot.category,
                    note: snapshot.note,
                    noteHandwritingImage: snapshot.noteHandwritingImage || undefined,
                    date: snapshot.date,
                  });
                  await queryClient.invalidateQueries({ queryKey: ["entries"] });
                },
              });
            } catch {
              pushToast({ tone: "danger", message: "Could not delete entry." });
            }
          },
        }}
      />
    </div>
  );
}
