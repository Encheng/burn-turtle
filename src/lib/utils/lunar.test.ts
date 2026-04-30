import { describe, it, expect } from 'vitest';
import { toLunarString, formatTalismanFooter, formatShareDate } from './lunar';

describe('toLunarString', () => {
  it('converts a known solar date to lunar Chinese string', () => {
    // 2026-02-17 is Lunar New Year (lunar 1/1) for year 丙午
    const lunar = toLunarString('2026-02-17');
    expect(lunar).toMatch(/丙午年/);
    expect(lunar).toMatch(/正月初一/);
  });

  it('returns empty string for invalid date', () => {
    expect(toLunarString('not-a-date')).toBe('');
    expect(toLunarString('')).toBe('');
  });
});

describe('formatTalismanFooter', () => {
  it('returns lunar date · location when no time', () => {
    const out = formatTalismanFooter({
      date: '2026-02-17',
      location: '玉山主峰'
    });
    expect(out).toMatch(/丙午年正月初一 · 玉山主峰/);
  });

  it('inserts time between date and location when present', () => {
    const out = formatTalismanFooter({
      date: '2026-02-17',
      time: '09:00',
      location: '玉山主峰'
    });
    expect(out).toMatch(/丙午年正月初一 09:00 · 玉山主峰/);
  });

  it('returns empty string for missing date or location', () => {
    expect(formatTalismanFooter({ date: '', location: 'x' })).toBe('');
    expect(formatTalismanFooter({ date: '2026-01-01', location: '' })).toBe('');
  });
});

describe('formatShareDate', () => {
  it('formats ISO date as YYYY/M/D', () => {
    expect(formatShareDate('2026-05-15')).toBe('2026/5/15');
  });
});
