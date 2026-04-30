import { Solar } from 'lunar-javascript';

/**
 * Convert ISO date 'YYYY-MM-DD' to a Chinese lunar string like "丙午年正月初一".
 * Returns empty string on invalid input.
 */
export function toLunarString(isoDate: string): string {
  if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return '';
  try {
    const [y, m, d] = isoDate.split('-').map(Number);
    const solar = Solar.fromYmd(y, m, d);
    const lunar = solar.getLunar();
    return `${lunar.getYearInGanZhi()}年${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`;
  } catch {
    return '';
  }
}

export function formatTalismanFooter(input: {
  date: string;
  time?: string;
  location: string;
}): string {
  const lunar = toLunarString(input.date);
  if (!lunar || !input.location) return '';
  const timePart = input.time ? ` ${input.time}` : '';
  return `${lunar}${timePart} · ${input.location}`;
}

/** ISO 'YYYY-MM-DD' → 'YYYY/M/D' for share text. */
export function formatShareDate(isoDate: string): string {
  if (!isoDate) return '';
  const [y, m, d] = isoDate.split('-').map(Number);
  return `${y}/${m}/${d}`;
}
