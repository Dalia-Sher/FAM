export type MucusType = 'eggwhite' | 'creamy' | 'sticky' | 'period_dry_spot';

export type DayEntry = {
  date?: string;
  bbt?: number;
  measureTime?: string;
  intercourse?: boolean;
  contraception?: string;
  mucus?: MucusType;
  peakDay?: boolean;
  sensation?: string;
  cervix?: string;
  ovulationPain?: boolean;
  /** Manual override for luteal day number; empty string clears override */
  lutealCountOverride?: number | null;
};

export type CycleMeta = {
  cycleNumber?: number;
  age?: number;
  month?: string;
  year?: string;
  cycleLength?: number;
  lutealLength?: number;
  shortest?: number;
  longest?: number;
  usualMeasureTime?: string;
  notes?: string;
  exercise?: string;
  travel?: string;
  illnessStress?: string;
  pms?: string;
  breastExam?: string;
  herbsVitamins?: string;
  supplements?: string;
};

export type Cycle = {
  id: string;
  createdAt: string;
  meta: CycleMeta;
  days: DayEntry[];
};

export type AppState = {
  cycles: Cycle[];
  activeCycleId: string;
};

export const DAYS_COUNT = 40;
export const BBT_MAX = 37.1;
export const BBT_MIN = 36.05;
export const BBT_STEP = 0.05;

export function bbtLevels(): number[] {
  const levels: number[] = [];
  for (let t = BBT_MAX; t >= BBT_MIN - 1e-9; t -= BBT_STEP) {
    levels.push(Math.round(t * 100) / 100);
  }
  return levels;
}

export function emptyDay(): DayEntry {
  return {};
}

export function createEmptyCycle(partial?: Partial<CycleMeta>): Cycle {
  return {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    meta: { ...partial },
    days: Array.from({ length: DAYS_COUNT }, () => emptyDay()),
  };
}
