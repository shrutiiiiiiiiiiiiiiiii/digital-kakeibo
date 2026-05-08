export const SUPPORTED_CURRENCIES = [
  "JPY",
  "USD",
  "EUR",
  "GBP",
  "INR",
  "AUD",
  "CAD",
  "SGD",
  "AED",
  "CHF",
] as const;

export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

export const CURRENCY_LABELS: Record<SupportedCurrency, string> = {
  JPY: "JPY ¥",
  USD: "USD $",
  EUR: "EUR €",
  GBP: "GBP £",
  INR: "INR ₹",
  AUD: "AUD A$",
  CAD: "CAD C$",
  SGD: "SGD S$",
  AED: "AED د.إ",
  CHF: "CHF Fr",
};

export function isSupportedCurrency(value: string): value is SupportedCurrency {
  return SUPPORTED_CURRENCIES.includes(value as SupportedCurrency);
}

export function isZeroDecimalCurrency(currency: string) {
  return currency === "JPY";
}
