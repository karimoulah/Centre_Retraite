import { siteConfig } from '@/config/site';

const { locale, timeZone } = siteConfig;

const moneyFormatter = new Intl.NumberFormat(locale, { style: 'currency', currency: 'CAD' });

/** Amounts are stored in cents everywhere; this is the only place they become dollars. */
export function formatMoney(cents: number): string {
  return moneyFormatter.format(cents / 100);
}

/** Converts a dollar input ("12,50", "12.5", 12.5) to integer cents, or null if invalid. */
export function dollarsToCents(input: string | number): number | null {
  const normalized = typeof input === 'number' ? input : Number(input.replace(/\s/g, '').replace(',', '.'));
  if (!Number.isFinite(normalized)) return null;
  return Math.round(normalized * 100);
}

type DateInput = Date | string | number;

const toDate = (value: DateInput) => (value instanceof Date ? value : new Date(value));

const dateFormats = {
  short: { year: 'numeric', month: '2-digit', day: '2-digit' },
  long: { year: 'numeric', month: 'long', day: 'numeric' },
  dayMonth: { month: 'long', day: 'numeric' },
} as const satisfies Record<string, Intl.DateTimeFormatOptions>;

/** Formats a date in fr-CA, America/Toronto: short = 2026-11-16, long = 16 novembre 2026. */
export function formatDate(value: DateInput, style: keyof typeof dateFormats = 'long'): string {
  return new Intl.DateTimeFormat(locale, { ...dateFormats[style], timeZone }).format(toDate(value));
}

/** 16 novembre 2026, 14 h 30 */
export function formatDateTime(value: DateInput): string {
  const date = toDate(value);
  const time = new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit', timeZone })
    .format(date)
    .replace(':', ' h ');
  return `${formatDate(date, 'long')}, ${time}`;
}

/** Period label: "1er au 30 novembre 2026", "15 novembre 2026 au 14 janvier 2027". */
export function formatPeriod(start: DateInput, end: DateInput): string {
  const from = toDate(start);
  const to = toDate(end);
  const part = (date: Date, options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(locale, { ...options, timeZone }).format(date);
  const day = (date: Date) => {
    const value = part(date, { day: 'numeric' });
    return value === '1' ? '1er' : value;
  };

  const sameYear = part(from, { year: 'numeric' }) === part(to, { year: 'numeric' });
  const sameMonth = sameYear && part(from, { month: 'long' }) === part(to, { month: 'long' });

  if (sameMonth) return `${day(from)} au ${day(to)} ${part(to, { month: 'long', year: 'numeric' })}`;
  if (sameYear)
    return `${day(from)} ${part(from, { month: 'long' })} au ${day(to)} ${part(to, { month: 'long', year: 'numeric' })}`;
  return `${day(from)} ${part(from, { month: 'long', year: 'numeric' })} au ${day(to)} ${part(to, { month: 'long', year: 'numeric' })}`;
}
