"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/design-system/Button";
import { Card } from "@/components/design-system/Card";
import { CurrencySelect } from "@/components/design-system/CurrencySelect";
import { HandwritingPad } from "@/components/HandwritingPad";
import { Input } from "@/components/design-system/Input";
import { Modal } from "@/components/design-system/Modal";
import { Spacer } from "@/components/design-system/Spacer";
import { ThemeToggle } from "@/components/design-system/ThemeToggle";
import { useAuth } from "@/lib/auth";
import { isSupportedCurrency, isZeroDecimalCurrency } from "@/lib/currencies";
import { fetchEntry, updateEntry } from "@/lib/entries-api";
import type { EntryCategory } from "@/lib/entries";

const CATEGORIES: { key: EntryCategory; labelEn: string; labelJa: string }[] = [
  { key: "needs", labelEn: "Needs", labelJa: "必要" },
  { key: "wants", labelEn: "Wants", labelJa: "欲しい" },
  { key: "culture", labelEn: "Culture", labelJa: "文化" },
  { key: "unexpected", labelEn: "Unexpected", labelJa: "意外" },
];

export function EditEntryClient() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { accessToken, user } = useAuth();

  const id = params.id;
  const locale = user?.locale ?? "en";
  const preferredCurrency = user?.settings.baseCurrency ?? user?.settings.currency ?? "JPY";
  const defaultCurrency = isSupportedCurrency(preferredCurrency) ? preferredCurrency : "JPY";

  const entryQuery = useQuery({
    queryKey: ["entry", id],
    enabled: Boolean(accessToken && id),
    queryFn: async () => {
      if (!accessToken) throw new Error("Not authenticated");
      return fetchEntry(accessToken, id);
    },
  });

  const entry = entryQuery.data?.entry;

  const [draft, setDraft] = useState<{
    amountText?: string;
    currency?: string;
    category?: EntryCategory;
    note?: string;
    noteHandwritingImage?: string;
    noteMode?: "text" | "handwrite";
  }>({});
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const baseAmountText = useMemo(() => {
    if (!entry) return "";
    if (isZeroDecimalCurrency(entry.currency)) return String(Math.round(entry.amount));
    return String(entry.amount);
  }, [entry]);
  const currency = draft.currency ?? entry?.currency ?? defaultCurrency;
  const amountText = draft.amountText ?? baseAmountText;
  const category = draft.category ?? entry?.category ?? "needs";
  const note = draft.note ?? entry?.note ?? "";
  const noteHandwritingImage = draft.noteHandwritingImage ?? entry?.noteHandwritingImage ?? "";
  const noteMode = draft.noteMode ?? (noteHandwritingImage ? "handwrite" : "text");

  const parsedAmount = useMemo(() => {
    if (!amountText) return NaN;
    if (isZeroDecimalCurrency(currency)) return Number.parseInt(amountText, 10);
    return Number.parseFloat(amountText);
  }, [amountText, currency]);

  useEffect(() => {
    if (!isZeroDecimalCurrency(currency)) return;
    if (!amountText.includes(".")) return;
    setDraft((prev) => ({ ...prev, amountText: amountText.replace(/\./g, "") }));
  }, [amountText, currency]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!accessToken) throw new Error("Not authenticated");
      if (!Number.isFinite(parsedAmount) || parsedAmount < 0) {
        throw new Error("Invalid amount");
      }
      return updateEntry(accessToken, id, {
        amount: isZeroDecimalCurrency(currency) ? Math.round(parsedAmount) : parsedAmount,
        currency,
        category,
        note: note.trim() ? note.trim() : "",
        noteHandwritingImage: noteHandwritingImage || "",
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["entries"] });
      await queryClient.invalidateQueries({ queryKey: ["entry", id] });
      router.replace("/entries");
    },
  });

  return (
    <div className="min-h-screen bg-background px-6 py-10 text-foreground">
      <div className="mx-auto flex w-full max-w-xl items-start justify-between gap-6">
        <Link href="/entries" className="font-display text-[15px] tracking-[0.16em] text-muted-foreground">
          Back
        </Link>
        <ThemeToggle />
      </div>

      <Spacer size="xl" />

      <div className="mx-auto w-full max-w-xl">
        {entryQuery.isLoading ? (
          <p className="font-sans text-sm text-muted-foreground">Loading entry…</p>
        ) : entryQuery.isError || !entry ? (
          <p className="font-sans text-sm text-enji">Could not load this entry.</p>
        ) : (
          <Card className="space-y-8">
            <div className="space-y-2">
              <h1 className="font-display text-3xl tracking-[0.08em]">Edit entry</h1>
              <p className="font-sans text-sm text-muted-foreground">Adjust gently — then confirm.</p>
            </div>

            <Input
              label="Amount"
              inputMode={isZeroDecimalCurrency(currency) ? "numeric" : "decimal"}
              value={amountText}
              onChange={(e) => setDraft((prev) => ({ ...prev, amountText: e.target.value }))}
            />

            <div className="space-y-2">
              <p className="block font-display text-[15px] font-medium tracking-[0.08em] text-sumi dark:text-washi">
                Currency
              </p>
              <CurrencySelect
                id="edit-entry-currency-select"
                value={currency}
                onChange={(code) => setDraft((prev) => ({ ...prev, currency: code }))}
              />
            </div>

            <div className="space-y-3">
              <p className="font-sans text-xs font-semibold tracking-[0.28em] uppercase text-muted-foreground">
                Category
              </p>
              <div className="grid grid-cols-2 gap-3">
                {CATEGORIES.map((c) => {
                  const selected = c.key === category;
                  const label = locale === "ja" ? c.labelJa : c.labelEn;
                  return (
                    <button
                      key={c.key}
                      type="button"
                      onClick={() => setDraft((prev) => ({ ...prev, category: c.key }))}
                      className={[
                        "min-h-[60px] rounded-2xl border px-4 text-left font-display text-[15px] tracking-[0.08em] transition",
                        selected
                          ? "border-sumi bg-kinari text-sumi shadow-md dark:border-washi dark:bg-sumi/40 dark:text-washi"
                          : "border-black/15 bg-white/55 text-sumi shadow-sm backdrop-blur-sm hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-sumi/25 dark:text-washi",
                      ].join(" ")}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex gap-3">
                <Button type="button" onClick={() => setDraft((prev) => ({ ...prev, noteMode: "text" }))}>
                  Type note
                </Button>
                <Button type="button" onClick={() => setDraft((prev) => ({ ...prev, noteMode: "handwrite" }))}>
                  Handwrite note
                </Button>
              </div>
              {noteMode === "text" ? (
                <Input
                  label="Note (optional)"
                  value={note}
                  maxLength={50}
                  onChange={(e) => setDraft((prev) => ({ ...prev, note: e.target.value }))}
                />
              ) : (
                <HandwritingPad
                  value={noteHandwritingImage}
                  onChange={(dataUrl) => setDraft((prev) => ({ ...prev, noteHandwritingImage: dataUrl }))}
                />
              )}
            </div>

            <Button
              type="button"
              onClick={() => setIsConfirmOpen(true)}
              disabled={!Number.isFinite(parsedAmount) || parsedAmount <= 0 || updateMutation.isPending}
            >
              Save changes
            </Button>
          </Card>
        )}
      </div>

      <Modal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        title="Save changes?"
        description="This updates your journal entry."
        primaryAction={{
          label: updateMutation.isPending ? "Saving…" : "Save",
          onClick: async () => {
            try {
              await updateMutation.mutateAsync();
              setIsConfirmOpen(false);
            } catch {
              setIsConfirmOpen(false);
            }
          },
        }}
      />
    </div>
  );
}
