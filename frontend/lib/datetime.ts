import {
  addDays,
  endOfDay,
  getDay,
  getISOWeek,
  getISOWeekYear,
  parse,
  startOfDay,
  startOfWeek,
} from "date-fns";
import { enUS } from "date-fns/locale/en-US";
import { ja } from "date-fns/locale/ja";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

export function getUserTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

export function utcIsoRangeForLocalDays({
  anchor,
  pastDays,
  futureDays,
  timeZone,
}: {
  anchor: Date;
  pastDays: number;
  futureDays: number;
  timeZone: string;
}) {
  const startLocalDay = startOfDay(addDays(anchor, -pastDays));
  const endLocalDay = endOfDay(addDays(anchor, futureDays));

  const fromUtc = fromZonedTime(startLocalDay, timeZone);
  const toUtc = fromZonedTime(endLocalDay, timeZone);

  return { fromUtc: fromUtc.toISOString(), toUtc: toUtc.toISOString() };
}

export function utcIsoRangeForCurrentLocalWeek(timeZone: string, anchor = new Date()) {
  const weekStart = startOfWeek(anchor, { weekStartsOn: 0 });
  const weekEnd = endOfDay(addDays(weekStart, 6));
  const fromUtc = fromZonedTime(startOfDay(weekStart), timeZone);
  const toUtc = fromZonedTime(weekEnd, timeZone);
  return { fromUtc: fromUtc.toISOString(), toUtc: toUtc.toISOString() };
}

export function weekPeriodFromDate(anchor = new Date()) {
  const week = String(getISOWeek(anchor)).padStart(2, "0");
  return `${getISOWeekYear(anchor)}-W${week}`;
}

export function localWeekday(anchor = new Date()) {
  return getDay(anchor);
}

export function formatDayHeadingFromLocalYmd(ymd: string, locale: "en" | "ja", timeZone: string) {
  // `ymd` is a stable grouping key like `2026-05-03` in the user's local calendar.
  const localNoon = parse(ymd, "yyyy-MM-dd", new Date());
  const utcAnchor = fromZonedTime(localNoon, timeZone);

  if (locale === "ja") {
    return formatInTimeZone(utcAnchor, timeZone, "M月d日 EEEE", { locale: ja });
  }
  return formatInTimeZone(utcAnchor, timeZone, "EEEE, MMM d", { locale: enUS });
}
