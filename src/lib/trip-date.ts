/** Parse trip `startDate` (YYYY.MM.DD or YYYY-MM-DD) to local calendar midnight. */
export function tripStartCalendarDate(startDate: string): Date | null {
  const s = startDate.trim();
  if (!s) return null;
  const parts = (s.includes("-") ? s.split("-") : s.split(".")).map((x) => Number(x.trim()));
  if (parts.length < 3 || parts.some((n) => !Number.isFinite(n))) return null;
  const [y, m, d] = parts;
  if (y == null || m == null || d == null) return null;
  const dt = new Date(y, m - 1, d);
  if (Number.isNaN(dt.getTime())) return null;
  return dt;
}

/** Whole calendar days from `ref` (default: today local) until trip start; negative = trip already started. */
export function calendarDaysUntilTripStart(
  startDate: string,
  ref: Date = new Date(),
): number | null {
  const dep = tripStartCalendarDate(startDate);
  if (!dep) return null;
  const refCal = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate());
  const depCal = new Date(dep.getFullYear(), dep.getMonth(), dep.getDate());
  return Math.round((depCal.getTime() - refCal.getTime()) / 86400000);
}
