export function formatMoney(amount: number, currency: string, locale: string) {
  const maximumFractionDigits = currency === "JPY" ? 0 : 2;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits,
    minimumFractionDigits: maximumFractionDigits === 0 ? 0 : 2,
  }).format(amount);
}
