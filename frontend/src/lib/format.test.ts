import { describe, expect, it } from 'vitest';

import { dollarsToCents, formatDate, formatDateTime, formatMoney, formatPeriod } from './format';

// Intl uses narrow no-break spaces; compare with plain spaces.
const plain = (value: string) => value.replace(/[  ]/g, ' ');

describe('formatMoney', () => {
  it('formats cents as Canadian dollars in fr-CA', () => {
    expect(plain(formatMoney(123456))).toBe('1 234,56 $');
    expect(plain(formatMoney(500))).toBe('5,00 $');
    expect(plain(formatMoney(-2500))).toBe('-25,00 $');
  });
});

describe('dollarsToCents', () => {
  it('accepts comma or dot decimals', () => {
    expect(dollarsToCents('12,50')).toBe(1250);
    expect(dollarsToCents('12.5')).toBe(1250);
    expect(dollarsToCents('1 000')).toBe(100000);
    expect(dollarsToCents(0.1 + 0.2)).toBe(30);
  });

  it('rejects invalid input', () => {
    expect(dollarsToCents('abc')).toBeNull();
  });
});

describe('formatDate', () => {
  it('uses the America/Toronto time zone', () => {
    // 03:00 UTC on Nov 17 is still Nov 16 in Toronto.
    expect(formatDate('2026-11-17T03:00:00Z')).toBe('16 novembre 2026');
    expect(formatDate('2026-11-17T03:00:00Z', 'short')).toBe('2026-11-16');
  });

  it('formats date and time in French style', () => {
    expect(formatDateTime('2026-11-16T19:30:00Z')).toBe('16 novembre 2026, 14 h 30');
  });
});

describe('formatPeriod', () => {
  it('shortens periods within a month or a year', () => {
    expect(formatPeriod('2026-11-01T12:00:00Z', '2026-11-30T12:00:00Z')).toBe('1er au 30 novembre 2026');
    expect(formatPeriod('2026-01-15T12:00:00Z', '2026-03-14T12:00:00Z')).toBe(
      '15 janvier au 14 mars 2026',
    );
    expect(formatPeriod('2026-11-15T12:00:00Z', '2027-01-14T12:00:00Z')).toBe(
      '15 novembre 2026 au 14 janvier 2027',
    );
  });
});
