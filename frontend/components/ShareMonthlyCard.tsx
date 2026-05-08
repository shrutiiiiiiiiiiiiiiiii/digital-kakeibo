import type { EntryCategory } from "@/lib/entries";
import { formatMoney } from "@/lib/money";

const CATEGORIES: EntryCategory[] = ["needs", "wants", "culture", "unexpected"];

type Props = {
  monthYear: string;
  locale: "en" | "ja";
  currency: string;
  totalSpent: number;
  byCategory: Partial<
    Record<
      EntryCategory,
      number | { total?: number; count?: number } | null | undefined
    >
  >;
  closingIntent?: string;
  showAmounts: boolean;
  showReflection: boolean;
};

export function ShareMonthlyCard({
  monthYear,
  locale,
  currency,
  totalSpent,
  byCategory,
  closingIntent,
  showAmounts,
  showReflection,
}: Props) {
  const localeCode = locale === "ja" ? "ja-JP" : "en-US";
  const categoryLabels: Record<EntryCategory, string> = {
    needs: locale === "ja" ? "必要" : "Needs",
    wants: locale === "ja" ? "欲しい" : "Wants",
    culture: locale === "ja" ? "文化" : "Culture",
    unexpected: locale === "ja" ? "意外" : "Unexpected",
  };
  const categoryColors: Record<EntryCategory, string> = {
    needs: "bg-sumi",
    wants: "bg-ai",
    culture: "bg-cha",
    unexpected: "bg-enji",
  };
  const safeTotalSpent = Number.isFinite(totalSpent) ? totalSpent : 0;

  function amountForCategory(cat: EntryCategory) {
    const raw = byCategory[cat];
    if (typeof raw === "number") return raw;
    if (raw && typeof raw === "object" && typeof raw.total === "number") return raw.total;
    return 0;
  }

  return (
    <div className="relative aspect-[9/16] w-full overflow-hidden rounded-[32px] border border-black/15 bg-washi p-8 text-sumi shadow-[0_24px_80px_-34px_rgba(0,0,0,0.45)]">
      <div className="absolute inset-0 opacity-[0.045] [background-image:radial-gradient(circle_at_1px_1px,_rgba(0,0,0,0.5)_1px,_transparent_0)] [background-size:12px_12px]" />
      <div className="relative z-10 flex h-full flex-col">
        <p className="font-display text-[34px] tracking-[0.08em] leading-tight">{monthYear}</p>
        <p className="mt-2 font-sans text-xs tracking-[0.22em] uppercase text-black/50">Digital Kakeibo</p>

        <div className="mt-8 rounded-2xl border border-black/10 bg-black/5 px-4 py-4">
          <p className="font-sans text-xs uppercase tracking-[0.18em] text-black/55">Total spent</p>
          <p className="mt-2 font-mono text-3xl tabular-nums">
            {showAmounts ? formatMoney(safeTotalSpent, currency, localeCode) : "—"}
          </p>
        </div>

        <div className="mt-8 overflow-hidden rounded-full border border-black/10 bg-black/5">
          <div className="flex h-7 w-full">
            {CATEGORIES.map((cat) => {
              const amount = amountForCategory(cat);
              const pct = safeTotalSpent > 0 ? (amount / safeTotalSpent) * 100 : 0;
              return (
                <div
                  key={cat}
                  className={[categoryColors[cat], "transition-[width] duration-300"].join(" ")}
                  style={{ width: `${pct}%`, minWidth: amount > 0 ? 8 : 0 }}
                />
              );
            })}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2">
          {CATEGORIES.map((cat) => (
            <div key={cat} className="rounded-xl border border-black/10 bg-black/5 px-3 py-2">
              <p className="font-display text-[11px] tracking-[0.16em] text-black/60">{categoryLabels[cat]}</p>
              <p className="mt-1 font-mono text-xs tabular-nums">
                {showAmounts ? formatMoney(amountForCategory(cat), currency, localeCode) : "—"}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-auto rounded-2xl border border-black/10 bg-black/5 px-4 py-4">
          <p className="font-sans text-[11px] uppercase tracking-[0.18em] text-black/55">
            {locale === "ja" ? "来月の一言" : "Next month intention"}
          </p>
          <p className="mt-2 font-sans text-sm leading-6 text-black/80">
            {showReflection ? closingIntent || (locale === "ja" ? "静かに、続ける。" : "Continue with intention.") : "—"}
          </p>
        </div>

        <p className="mt-4 text-right font-sans text-[10px] tracking-[0.12em] text-black/45">digitalkakeibo.app</p>
      </div>
    </div>
  );
}
