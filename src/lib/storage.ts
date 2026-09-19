import type { AppState, Cycle } from '../types';
import { createEmptyCycle } from '../types';
import { ensureDays } from './helpers';

const STORAGE_KEY = 'fam-chart-v1';

function normalizeCycle(raw: Cycle): Cycle {
  return {
    ...raw,
    meta: raw.meta ?? {},
    days: ensureDays(raw.days ?? []),
  };
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const cycle = createEmptyCycle();
      return { cycles: [cycle], activeCycleId: cycle.id };
    }
    const parsed = JSON.parse(raw) as AppState;
    if (!parsed.cycles?.length) {
      const cycle = createEmptyCycle();
      return { cycles: [cycle], activeCycleId: cycle.id };
    }
    const cycles = parsed.cycles.map(normalizeCycle);
    const activeCycleId =
      cycles.find((c) => c.id === parsed.activeCycleId)?.id ?? cycles[0].id;
    return { cycles, activeCycleId };
  } catch {
    const cycle = createEmptyCycle();
    return { cycles: [cycle], activeCycleId: cycle.id };
  }
}

export function saveState(state: AppState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function exportStateJson(state: AppState): string {
  return JSON.stringify(state, null, 2);
}

export function importStateJson(json: string): AppState {
  const parsed = JSON.parse(json) as AppState;
  if (!parsed?.cycles?.length) throw new Error('קובץ לא תקין');
  const cycles = parsed.cycles.map(normalizeCycle);
  return {
    cycles,
    activeCycleId:
      cycles.find((c) => c.id === parsed.activeCycleId)?.id ?? cycles[0].id,
  };
}
