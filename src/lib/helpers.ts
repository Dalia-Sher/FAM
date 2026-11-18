import type { Cycle, DayEntry, MucusType } from '../types';
import { DAYS_COUNT } from '../types';

const WEEKDAYS_HE = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];

const MONTH_NAMES: Record<string, number> = {
  '1': 1, '01': 1, january: 1, jan: 1, ינואר: 1,
  '2': 2, '02': 2, february: 2, feb: 2, פברואר: 2,
  '3': 3, '03': 3, march: 3, mar: 3, מרץ: 3, מרס: 3,
  '4': 4, '04': 4, april: 4, apr: 4, אפריל: 4,
  '5': 5, '05': 5, may: 5, מאי: 5,
  '6': 6, '06': 6, june: 6, jun: 6, יוני: 6,
  '7': 7, '07': 7, july: 7, jul: 7, יולי: 7,
  '8': 8, '08': 8, august: 8, aug: 8, אוגוסט: 8,
  '9': 9, '09': 9, september: 9, sep: 9, ספטמבר: 9,
  '10': 10, october: 10, oct: 10, אוקטובר: 10,
  '11': 11, november: 11, nov: 11, נובמבר: 11,
  '12': 12, december: 12, dec: 12, דצמבר: 12,
};

/** Normalize stored value to day-of-month (1–31). Supports legacy ISO dates. */
export function dayOfMonthValue(raw?: string): string {
  if (!raw) return '';
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return String(Number(iso[3]));
  if (/^\d{1,2}$/.test(raw)) {
    const n = Number(raw);
    if (n >= 1 && n <= 31) return String(n);
  }
  return '';
}

export function parseMonth(month?: string): number | undefined {
  if (!month) return undefined;
  const key = month.trim().toLowerCase();
  return MONTH_NAMES[key] ?? MONTH_NAMES[month.trim()];
}

function makeDate(year: number, month: number, day: number): Date | null {
  const d = new Date(year, month - 1, day);
  if (Number.isNaN(d.getTime()) || d.getMonth() !== month - 1 || d.getDate() !== day) {
    return null;
  }
  return d;
}

function baseYearMonth(month?: string, year?: string): { year: number; month: number } {
  const now = new Date();
  const m = parseMonth(month) ?? now.getMonth() + 1;
  const yRaw = Number(year);
  const y = Number.isFinite(yRaw) && yRaw >= 1000 ? yRaw : now.getFullYear();
  return { year: y, month: m };
}

/**
 * Resolve a calendar Date for a cycle column from day-of-month (+ header month/year).
 * Falls back to the current month/year so weekday autofills as soon as a day is entered.
 * Handles month rollover when day numbers go e.g. 30 → 31 → 1 → 2.
 */
export function resolveDayDate(
  days: DayEntry[],
  dayIndex: number,
  month?: string,
  year?: string,
): Date | null {
  const raw = days[dayIndex]?.date;
  if (!raw) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const d = new Date(raw + 'T12:00:00');
    return Number.isNaN(d.getTime()) ? null : d;
  }

  const targetDom = Number(dayOfMonthValue(raw));
  if (!targetDom) return null;

  const base = baseYearMonth(month, year);

  let firstIdx = -1;
  for (let i = 0; i < days.length; i++) {
    if (dayOfMonthValue(days[i]?.date)) {
      firstIdx = i;
      break;
    }
  }
  if (firstIdx < 0) return null;

  const firstRaw = days[firstIdx].date!;
  let curY: number;
  let curM: number;
  let curD: number;

  if (/^\d{4}-\d{2}-\d{2}$/.test(firstRaw)) {
    const d = new Date(firstRaw + 'T12:00:00');
    if (Number.isNaN(d.getTime())) return null;
    curY = d.getFullYear();
    curM = d.getMonth() + 1;
    curD = d.getDate();
  } else {
    curD = Number(dayOfMonthValue(firstRaw));
    curY = base.year;
    curM = base.month;
  }

  if (firstIdx === dayIndex) return makeDate(curY, curM, curD);

  for (let i = firstIdx + 1; i <= dayIndex; i++) {
    const domStr = dayOfMonthValue(days[i]?.date);
    if (!domStr) continue;
    const dom = Number(domStr);
    if (dom < curD) {
      curM += 1;
      if (curM > 12) {
        curM = 1;
        curY += 1;
      }
    }
    curD = dom;
  }

  return makeDate(curY, curM, curD);
}

/**
 * Day-of-month strings for the next `count` calendar days after `startDom`
 * in the given month/year (rolls into the following month when needed).
 */
export function followingDayOfMonthSeries(
  startDom: number,
  month?: string,
  year?: string,
  count = 30,
): string[] {
  const { year: y, month: m } = baseYearMonth(month, year);
  let cursor = makeDate(y, m, startDom);
  if (!cursor) {
    // Invalid DOM for that month (e.g. 31 in April) — still advance from that wall date.
    cursor = new Date(y, m - 1, startDom);
  }
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    cursor = new Date(
      cursor.getFullYear(),
      cursor.getMonth(),
      cursor.getDate() + 1,
    );
    out.push(String(cursor.getDate()));
  }
  return out;
}

export function weekdayForCycleDay(
  days: DayEntry[],
  dayIndex: number,
  month?: string,
  year?: string,
): string {
  const d = resolveDayDate(days, dayIndex, month, year);
  if (!d) return '';
  return WEEKDAYS_HE[d.getDay()];
}

export function weekdayFromDayOfMonth(
  dayRaw?: string,
  month?: string,
  year?: string,
): string {
  const day = Number(dayOfMonthValue(dayRaw));
  if (!day) return '';
  const { year: y, month: m } = baseYearMonth(month, year);
  const d = makeDate(y, m, day);
  if (!d) return '';
  return WEEKDAYS_HE[d.getDay()];
}

/** Lubricated / slippery vaginal sensation (תחושת סיכוך) from free-text. */
export function hasLubricatedSensation(sensation?: string): boolean {
  if (!sensation) return false;
  const t = sensation.trim().toLowerCase().replace(/\s+/g, '');
  return /סיכוך|חלקלק|מתיח|לח|לחה|רטוב|רטובה|slip|wet|lube/.test(t);
}

/**
 * Fertility rank for peak-day detection (זיהוי יום השיא):
 * 3 = egg-white mucus or lubricated sensation
 * 2 = creamy / milky
 * 1 = sticky
 * 0 = dry / period / spotting / empty
 */
export function fertilitySignRank(day: DayEntry): number {
  if (hasLubricatedSensation(day.sensation) || day.mucus === 'eggwhite') return 3;
  if (day.mucus === 'creamy') return 2;
  if (day.mucus === 'sticky') return 1;
  return 0;
}

/**
 * Peak day = last day of the most fertile mucus/sensation in the cycle,
 * confirmed when the following day is drier (lower rank).
 */
export function computePeakDayIndex(days: DayEntry[]): number {
  let maxRank = 0;
  for (const d of days) {
    maxRank = Math.max(maxRank, fertilitySignRank(d));
  }
  if (maxRank <= 0) return -1;

  let peak = -1;
  for (let i = 0; i < days.length; i++) {
    if (fertilitySignRank(days[i]!) !== maxRank) continue;
    const next = days[i + 1];
    if (next != null && fertilitySignRank(next) < maxRank) {
      peak = i;
    }
  }
  return peak;
}

/** Manual peakDay if set; otherwise auto from mucus/sensation. */
export function findPeakDayIndex(days: DayEntry[]): number {
  const manual = days.findIndex((d) => d.peakDay);
  if (manual >= 0) return manual;
  return computePeakDayIndex(days);
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
 * Luteal phase day count: day 1 = first thermal rise (≥0.1°C above the
 * highest of the previous 6 temps — same rule as הקו המפריד), then 2, 3…
 * through the end of the cycle. Editable via lutealCountOverride.
 */
export function lutealCountLabel(days: DayEntry[], dayIndex: number): string {
  const day = days[dayIndex];
  if (day?.lutealCountOverride != null && day.lutealCountOverride > 0) {
    return String(day.lutealCountOverride);
  }
  if (day?.lutealCountOverride === 0) return '';

  const sep = computeSeparatingLine(days);
  if (!sep) return '';
  if (dayIndex < sep.riseDayIndex) return '';
  return String(dayIndex - sep.riseDayIndex + 1);
}

export function isFertileRelevant(day: DayEntry, dayIndex: number, days: DayEntry[]): boolean {
  if (day.mucus === 'eggwhite' || day.mucus === 'creamy') return true;
  if (hasLubricatedSensation(day.sensation)) return true;
  const peak = findPeakDayIndex(days);
  if (peak >= 0 && dayIndex >= peak && dayIndex <= peak + 3) return true;
  return false;
}

/** Result of FAM coverline / הקו המפריד detection. */
export type SeparatingLineInfo = {
  /** Coverline temperature (°C): max of baseline 6 + 0.05 */
  level: number;
  /** First day index with a rise of ≥0.1°C above the baseline max */
  riseDayIndex: number;
  /** Inclusive start of the 6 days before the rise */
  baselineStart: number;
  /** Inclusive end of the 6 days before the rise */
  baselineEnd: number;
  baselineMax: number;
};

/**
 * Draw the separating line (הקו המפריד) after the first thermal shift:
 * find the first day whose BBT is ≥0.1°C above the highest of the previous
 * six recorded temperatures, then place the line at that max + 0.05°C.
 */
export function computeSeparatingLine(days: DayEntry[]): SeparatingLineInfo | null {
  for (let r = 6; r < days.length; r++) {
    const rise = days[r]?.bbt;
    if (rise == null) continue;

    const baseline: number[] = [];
    let complete = true;
    for (let i = r - 6; i < r; i++) {
      const t = days[i]?.bbt;
      if (t == null) {
        complete = false;
        break;
      }
      baseline.push(t);
    }
    if (!complete) continue;

    const baselineMax = Math.max(...baseline);
    if (rise + 1e-9 >= baselineMax + 0.1) {
      return {
        level: Math.round((baselineMax + 0.05) * 100) / 100,
        riseDayIndex: r,
        baselineStart: r - 6,
        baselineEnd: r - 1,
        baselineMax,
      };
    }
  }
  return null;
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
    case 'period':
      return 'וסת';
    case 'spotting':
      return 'הכתמה';
    case 'dry':
      return 'יבש';
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
