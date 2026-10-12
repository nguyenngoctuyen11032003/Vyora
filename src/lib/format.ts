// Formatting + local-date helpers. All dates are local (device time), never UTC.

/** `mm:ss`, or `h:mm:ss` from one hour. Negative input counts as 0. */
export function formatClock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

/** Integer with Vietnamese thousands separator: 1850 → "1.850". */
export function formatInt(n: number): string {
  return Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/** Fixed decimals with a Vietnamese comma: (7, 1) → "7,0". */
export function formatDecimal(n: number, digits = 1): string {
  return n.toFixed(digits).replace(".", ",");
}

/** kg with at most one decimal and no trailing ",0": 70 → "70", 70.5 → "70,5". */
export function formatKg(kg: number): string {
  const r = Math.round(kg * 10) / 10;
  return Number.isInteger(r) ? String(r) : formatDecimal(r, 1);
}

const pad2 = (n: number) => String(n).padStart(2, "0");

/** Local 'YYYY-MM-DD'. */
export function toLocalDate(d: Date | string | number): string {
  const x = new Date(d);
  return `${x.getFullYear()}-${pad2(x.getMonth() + 1)}-${pad2(x.getDate())}`;
}

/** Local 'HH:MM'. */
export function toLocalTime(d: Date | string | number): string {
  const x = new Date(d);
  return `${pad2(x.getHours())}:${pad2(x.getMinutes())}`;
}

/** Parses 'YYYY-MM-DD' as a local date (midnight). */
export function parseLocalDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function addDaysIso(iso: string, days: number): string {
  const d = parseLocalDate(iso);
  d.setDate(d.getDate() + days);
  return toLocalDate(d);
}

/** Monday ('YYYY-MM-DD') of the week containing `d`. */
export function weekStartIso(d: Date | string | number = new Date()): string {
  const x = typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d) ? parseLocalDate(d) : new Date(d);
  const offset = (x.getDay() + 6) % 7; // Monday = 0
  x.setDate(x.getDate() - offset);
  return toLocalDate(x);
}

/** The 7 dates Monday → Sunday of the week containing `d`. */
export function weekDates(d: Date | string | number = new Date()): string[] {
  const start = weekStartIso(d);
  return Array.from({ length: 7 }, (_, i) => addDaysIso(start, i));
}

/** "10/10" from 'YYYY-MM-DD'. */
export function formatDayMonth(iso: string): string {
  const d = parseLocalDate(iso);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

/** Short weekday labels indexed by JS getDay() (0 = Sunday). */
export const WEEKDAY_SHORT = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"] as const;
/** Long weekday labels indexed by JS getDay(). */
export const WEEKDAY_LONG = ["Chủ nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"] as const;

export function weekdayShort(iso: string): string {
  return WEEKDAY_SHORT[parseLocalDate(iso).getDay()];
}

/** Whole years between birthDate and `today`. */
export function ageFrom(birthDate: string | null | undefined, today: Date = new Date()): number | null {
  if (!birthDate || !/^\d{4}-\d{2}-\d{2}/.test(birthDate)) return null;
  const b = parseLocalDate(birthDate.slice(0, 10));
  let age = today.getFullYear() - b.getFullYear();
  const beforeBirthday =
    today.getMonth() < b.getMonth() || (today.getMonth() === b.getMonth() && today.getDate() < b.getDate());
  if (beforeBirthday) age -= 1;
  return age >= 0 && age < 130 ? age : null;
}

/** "14:05" style time of an ISO timestamp, used for "dữ liệu lúc …". */
export function formatTimeOf(iso: string): string {
  return toLocalTime(iso);
}
