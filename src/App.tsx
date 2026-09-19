import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { AppState, Cycle, CycleMeta, DayEntry } from './types';
import { createEmptyCycle } from './types';
import {
  exportStateJson,
  importStateJson,
  loadState,
  saveState,
} from './lib/storage';
import { cycleDisplayName } from './lib/helpers';
import { ChartHeader } from './components/ChartHeader';
import { BbtGrid } from './components/BbtGrid';
import { DayMarkers } from './components/DayMarkers';
import { ChartNotes } from './components/ChartNotes';
import './styles/chart.css';

export default function App() {
  const [state, setState] = useState<AppState>(() => loadState());
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const active = useMemo(
    () => state.cycles.find((c) => c.id === state.activeCycleId) ?? state.cycles[0],
    [state],
  );

  const updateActive = useCallback((updater: (cycle: Cycle) => Cycle) => {
    setState((prev) => ({
      ...prev,
      cycles: prev.cycles.map((c) =>
        c.id === prev.activeCycleId ? updater(c) : c,
      ),
    }));
  }, []);

  const setMeta = (meta: CycleMeta) => {
    updateActive((c) => ({ ...c, meta }));
  };

  const updateDay = (dayIndex: number, patch: Partial<DayEntry>) => {
    updateActive((c) => {
      const days = c.days.map((d, i) => {
        if (i !== dayIndex) {
          if (patch.peakDay === true && d.peakDay) return { ...d, peakDay: false };
          return d;
        }
        return { ...d, ...patch };
      });
      return { ...c, days };
    });
  };

  const setBbt = (dayIndex: number, bbt: number | undefined) => {
    updateDay(dayIndex, { bbt });
  };

  const addCycle = () => {
    const cycle = createEmptyCycle({
      age: active.meta.age,
      usualMeasureTime: active.meta.usualMeasureTime,
      cycleNumber: (active.meta.cycleNumber ?? state.cycles.length) + 1,
    });
    setState((prev) => ({
      cycles: [...prev.cycles, cycle],
      activeCycleId: cycle.id,
    }));
  };

  const deleteCycle = () => {
    if (state.cycles.length <= 1) {
      const fresh = createEmptyCycle();
      setState({ cycles: [fresh], activeCycleId: fresh.id });
      return;
    }
    if (!confirm('למחוק את המחזור הנוכחי?')) return;
    setState((prev) => {
      const cycles = prev.cycles.filter((c) => c.id !== prev.activeCycleId);
      return { cycles, activeCycleId: cycles[0].id };
    });
  };

  const doExport = () => {
    const blob = new Blob([exportStateJson(state)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fam-chart-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const doImport = async (file: File) => {
    try {
      const text = await file.text();
      const next = importStateJson(text);
      setState(next);
    } catch {
      alert('ייבוא נכשל — בדקי שזה קובץ גיבוי תקין.');
    }
  };

  return (
    <div className="app">
      <div className="toolbar no-print">
        <div className="toolbar-brand">
          <strong>שמ״פ</strong>
          <span>טבלת מעקב דיגיטלית</span>
        </div>
        <div className="toolbar-actions">
          <label className="cycle-select">
            מחזור
            <select
              value={state.activeCycleId}
              onChange={(e) =>
                setState((prev) => ({ ...prev, activeCycleId: e.target.value }))
              }
            >
              {state.cycles.map((c, i) => (
                <option key={c.id} value={c.id}>
                  {cycleDisplayName(c, i)}
                </option>
              ))}
            </select>
          </label>
          <button type="button" onClick={addCycle}>
            מחזור חדש
          </button>
          <button type="button" className="danger" onClick={deleteCycle}>
            מחק מחזור
          </button>
          <button type="button" onClick={() => window.print()}>
            הדפסה / PDF
          </button>
          <button type="button" onClick={doExport}>
            ייצוא גיבוי
          </button>
          <button type="button" onClick={() => fileRef.current?.click()}>
            ייבוא גיבוי
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void doImport(f);
              e.target.value = '';
            }}
          />
        </div>
      </div>

      <p className="disclaimer no-print">
        כלי תיעוד בלבד — אינו ייעוץ רפואי ואינו מחליף למידה עם מדריכה מוסמכת. סימון
        חלון הפוריות הוא ויזואלי לפי מה שסימנת בטבלה.
      </p>

      <main className="chart-sheet">
        <ChartHeader meta={active.meta} onChange={setMeta} />

        <div className="chart-scroll">
          <div className="chart-body">
            <DayMarkers
              section="top"
              days={active.days}
              usualMeasureTime={active.meta.usualMeasureTime}
              onUpdateDay={updateDay}
            />
            <BbtGrid days={active.days} onSetBbt={setBbt} />
            <DayMarkers
              section="bottom"
              days={active.days}
              usualMeasureTime={active.meta.usualMeasureTime}
              onUpdateDay={updateDay}
            />
          </div>
        </div>

        <ChartNotes meta={active.meta} onChange={setMeta} />
      </main>
    </div>
  );
}
