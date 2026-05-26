// Persian (Jalali) date formatting via native Intl (no dependency).
const fmt = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
  year: "numeric", month: "long", day: "numeric",
});
const fmtShort = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
  year: "numeric", month: "2-digit", day: "2-digit",
});
const fmtDateTime = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
  year: "numeric", month: "2-digit", day: "2-digit",
  hour: "2-digit", minute: "2-digit",
});

export const toJalali = (d: Date | number | string) => fmt.format(new Date(d));
export const toJalaliShort = (d: Date | number | string) => fmtShort.format(new Date(d));
export const toJalaliDateTime = (d: Date | number | string) => fmtDateTime.format(new Date(d));

/** Returns true if the timestamp falls on today's Jalali calendar date. */
export const isJalaliToday = (ts: number) =>
  toJalaliShort(ts) === toJalaliShort(Date.now());

/** Returns true if the timestamp falls on yesterday's Jalali calendar date. */
export const isJalaliYesterday = (ts: number) =>
  toJalaliShort(ts) === toJalaliShort(Date.now() - 86400000);
