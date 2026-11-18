import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import type { AppState, Cycle, CycleMeta, DayEntry } from './types';
import { createEmptyCycle, DAYS_COUNT, PRINT_DAYS_COUNT } from './types';
import {
  exportStateJson,
  importStateJson,
  loadState,
  saveState,
} from './lib/storage';
import {
  cycleDisplayName,
  computeFinishedCycleMeta,
  dayOfMonthValue,
  followingDayOfMonthSeries,
} from './lib/helpers';
import { ChartHeader } from './components/ChartHeader';
import { BbtGrid } from './components/BbtGrid';
import { DayMarkers } from './components/DayMarkers';
import { ChartNotes } from './components/ChartNotes';
import './styles/chart.css';

export default function App() {
  const [state, setState] = useState<AppState>(() => loadState());
  const [printing, setPrinting] = useState(false);
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
    updateActive((c) => {
      const start = Number(dayOfMonthValue(c.days[0]?.date));
      if (
        start >= 1 &&
        start <= 31 &&
        (meta.month !== c.meta.month || meta.year !== c.meta.year)
      ) {
        const following = followingDayOfMonthSeries(start, meta.month, meta.year, 30);
        return {
          ...c,
          meta,
          days: c.days.map((d, i) =>
            i >= 1 && i <= 30 ? { ...d, date: following[i - 1] } : d,
          ),
        };
      }
      return { ...c, meta };
    });
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

      // First cycle day date → fill the next 30 calendar days from header month/year.
      if (dayIndex === 0 && patch.date) {
        const start = Number(dayOfMonthValue(String(patch.date)));
        if (start >= 1 && start <= 31) {
          const following = followingDayOfMonthSeries(
            start,
            c.meta.month,
            c.meta.year,
            30,
          );
          return {
            ...c,
            days: days.map((d, i) =>
              i >= 1 && i <= 30 ? { ...d, date: following[i - 1] } : d,
            ),
          };
        }
      }

      return { ...c, days };
    });
  };

  const setBbt = (dayIndex: number, bbt: number | undefined) => {
    updateDay(dayIndex, { bbt });
  };

  const addCycle = () => {
    // Keep only stable identity fields — notes/disturbances stay empty for the new cycle.
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

  const finishCycle = () => {
    const { cycleLength, lutealLength } = computeFinishedCycleMeta(active.days);
    if (cycleLength == null) {
      alert('אין מספיק נתונים בטבלה כדי לחשב אורך מחזור.');
      return;
    }
    updateActive((c) => ({
      ...c,
      meta: {
        ...c.meta,
        cycleLength,
        ...(lutealLength != null ? { lutealLength } : {}),
      },
    }));
    if (lutealLength == null) {
      alert(
        'אורך המחזור עודכן, אבל לא ניתן לחשב אורך שלב לוטאלי.\n' +
          'צריך עליית חום (שישה ימי BBT ואז עלייה של לפחות 0.1°) או סימון יום שיא עם ימים אחריו.',
      );
    }
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

  const handlePrint = () => {
    const root = document.documentElement;
    // Match reference PDF: days 1–34, RTL labels on the right, A4 portrait.
    flushSync(() => setPrinting(true));
    root.classList.add('is-printing');

    const cleanup = () => {
      root.classList.remove('is-printing');
      setPrinting(false);
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
    window.setTimeout(cleanup, 4000);

    try {
      window.print();
    } catch {
      cleanup();
      alert(
        'לא ניתן לפתוח הדפסה בדפדפן זה.\nבאייפון: כפתור השיתוף (□↑) ← הדפסה ← שמירת PDF.',
      );
    }
  };

  const printDayCount = printing ? PRINT_DAYS_COUNT : DAYS_COUNT;

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
          <button type="button" onClick={finishCycle} title="ממלא אוטומטית אורך מחזור ואורך שלב לוטאלי">
            סיימתי
          </button>
          <button type="button" className="danger" onClick={deleteCycle}>
            מחק מחזור
          </button>
          <button type="button" onClick={handlePrint}>
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

      <main className={`chart-sheet${printing ? ' printing-chart' : ''}`}>
          <ChartHeader key={`${active.id}-header`} meta={active.meta} onChange={setMeta} />

          <div className="chart-scroll">
            <div className="chart-body">
              <DayMarkers
                section="top"
                days={active.days}
                month={active.meta.month}
                year={active.meta.year}
                usualMeasureTime={active.meta.usualMeasureTime}
                onUpdateDay={updateDay}
                dayCount={printDayCount}
                plainValues={printing}
              />
              <BbtGrid
                days={active.days}
                onSetBbt={setBbt}
                dayCount={printDayCount}
              />
              <DayMarkers
                section="bottom"
                days={active.days}
                month={active.meta.month}
                year={active.meta.year}
                usualMeasureTime={active.meta.usualMeasureTime}
                onUpdateDay={updateDay}
                dayCount={printDayCount}
                plainValues={printing}
              />
            </div>
          </div>

          <ChartNotes key={`${active.id}-notes`} meta={active.meta} onChange={setMeta} />
      </main>
    </div>
  );
}
