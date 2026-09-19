import type { Cycle, DayEntry, MucusType } from '../types';
import { DAYS_COUNT } from '../types';

const WEEKDAYS_HE = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];

export function weekdayFromDate(isoDate?: string): string {
  if (!isoDate) return '';
  const d = new Date(isoDate + 'T12:00:00');
  if (Number.isNaN(d.getTime())) return '';
  return WEEKDAYS_HE[d.getDay()];
}

/** Index of the (first) peak day, or -1 */
export function findPeakDayIndex(days: DayEntry[]): number {
  return days.findIndex((d) => d.peakDay);
}

/**
 * Post-peak counts: peak day shows "יש", following days 1, 2, 3...
 */
export function postPeakLabel(days: DayEntry[], dayIndex: number): string {
  const peak = findPeakDayIndex(days);
  if (peak < 0) return '';
  if (dayIndex === peak) return 'יש';
  if (dayIndex > peak) return String(dayIndex - peak);
  return '';
}

/**
 * Luteal phase day count: starts the day after peak (editable via override).
 * Returns display string for that day column.
 */
export function lutealCountLabel(days: DayEntry[], dayIndex: number): string {
  const day = days[dayIndex];
  if (day?.lutealCountOverride != null && day.lutealCountOverride > 0) {
    return String(day.lutealCountOverride);
  }
  if (day?.lutealCountOverride === 0) return '';

  const peak = findPeakDayIndex(days);
  if (peak < 0) return '';
  if (dayIndex <= peak) return '';
  return String(dayIndex - peak);
}

export function isFertileRelevant(day: DayEntry, dayIndex: number, days: DayEntry[]): boolean {
  if (day.peakDay) return true;
  if (day.mucus === 'eggwhite' || day.mucus === 'creamy') return true;
  const peak = findPeakDayIndex(days);
  if (peak >= 0 && dayIndex > peak && dayIndex <= peak + 3) return true;
  return false;
}

export function displayMeasureTime(day: DayEntry, usual?: string): string {
  if (day.measureTime) return day.measureTime;
  if (day.bbt != null && usual) return usual;
  return day.measureTime ?? '';
}

export function mucusLabel(m?: MucusType): string {
  switch (m) {
    case 'eggwhite':
      return 'דמוי חלבון־ביצה';
    case 'creamy':
      return 'חלבי';
    case 'sticky':
      return 'דביק';
    case 'period_dry_spot':
      return 'וסת / יובש / הכתמה';
    default:
      return '';
  }
}

export function cycleDisplayName(cycle: Cycle, index: number): string {
  const n = cycle.meta.cycleNumber ?? index + 1;
  const month = cycle.meta.month ? ` · ${cycle.meta.month}` : '';
  const year = cycle.meta.year ? ` ${cycle.meta.year}` : '';
  return `מחזור ${n}${month}${year}`;
}

export function ensureDays(days: DayEntry[]): DayEntry[] {
  const next = days.slice(0, DAYS_COUNT);
  while (next.length < DAYS_COUNT) next.push({});
  return next;
}
