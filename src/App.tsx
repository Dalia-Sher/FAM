import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { AppState, Cycle, CycleMeta, DayEntry } from './types';
import { createEmptyCycle } from './types';
import {
  exportStateJson,
  importStateJson,
  loadState,
  saveState,
} from './lib/storage';
import { cycleDisplayName, cycleFileStem } from './lib/helpers';
import { ChartHeader } from './components/ChartHeader';
import { BbtGrid } from './components/BbtGrid';
import { DayMarkers } from './components/DayMarkers';
import { ChartNotes } from './components/ChartNotes';
import './styles/chart.css';

function isMobileLike() {
  if (typeof navigator === 'undefined') return false;
  return (
    /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) ||
    window.matchMedia('(pointer: coarse)').matches
  );
}

export default function App() {
  const [state, setState] = useState<AppState>(() => loadState());
  const [exporting, setExporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const chartSheetRef = useRef<HTMLDivElement>(null);

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
    a.download = `${cycleFileStem(active.meta)}-backup.json`;
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

  const handleDesktopPrint = () => {
    const root = document.documentElement;
    root.classList.add('is-printing');

    const cleanup = () => {
      root.classList.remove('is-printing');
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
    window.setTimeout(cleanup, 4000);

    try {
      window.print();
    } catch {
      cleanup();
      alert('לא ניתן לפתוח הדפסה בדפדפן זה.');
    }
  };

  const handleMobileSave = async () => {
    const sheet = chartSheetRef.current;
    if (!sheet || exporting) return;

    setExporting(true);
    const scroll = sheet.querySelector('.chart-scroll') as HTMLElement | null;
    const prevOverflow = scroll?.style.overflow ?? '';
    const prevDirection = scroll?.style.direction ?? '';

    try {
      if (scroll) {
        scroll.style.overflow = 'visible';
        scroll.style.direction = 'ltr';
      }

      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(sheet, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#f7f2e8',
        width: Math.max(sheet.scrollWidth, sheet.clientWidth),
        windowWidth: Math.max(sheet.scrollWidth, sheet.clientWidth),
      });

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/png'),
      );
      if (!blob) throw new Error('capture failed');

      const stem = cycleFileStem(active.meta);
      const filename = `${stem}.png`;
      const file = new File([blob], filename, { type: 'image/png' });

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: stem,
        });
        return;
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      alert('התמונה מוכנה. אפשר לשמור אותה ואז להדפיס / לשמור כ־PDF.');
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      alert(
        'השמירה נכשלה.\nבאייפון אפשר גם: כפתור השיתוף של ספארי (□↑) ← הדפסה ← שמירת PDF.',
      );
    } finally {
      if (scroll) {
        scroll.style.overflow = prevOverflow;
        scroll.style.direction = prevDirection;
      }
      setExporting(false);
    }
  };

  const handlePrintOrSave = () => {
    if (isMobileLike()) {
      void handleMobileSave();
      return;
    }
    handleDesktopPrint();
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
          <button
            type="button"
            className="btn-print"
            disabled={exporting}
            onClick={handlePrintOrSave}
          >
            {exporting ? 'מכין…' : isMobileLike() ? 'שמירה / שיתוף' : 'הדפסה / PDF'}
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

      <button
        type="button"
        className="mobile-save-bar no-print"
        disabled={exporting}
        onClick={handlePrintOrSave}
      >
        {exporting ? 'מכין תמונה…' : 'שמירה / שיתוף של הטבלה'}
      </button>

      <p className="disclaimer no-print">
        כלי תיעוד בלבד — אינו ייעוץ רפואי ואינו מחליף למידה עם מדריכה מוסמכת. סימון
        חלון הפוריות הוא ויזואלי לפי מה שסימנת בטבלה.
      </p>

      <main>
        <div className="chart-sheet" ref={chartSheetRef}>
          <ChartHeader meta={active.meta} onChange={setMeta} />

          <div className="chart-scroll">
            <div className="chart-body">
              <DayMarkers
                section="top"
                days={active.days}
                month={active.meta.month}
                year={active.meta.year}
                usualMeasureTime={active.meta.usualMeasureTime}
                onUpdateDay={updateDay}
              />
              <BbtGrid days={active.days} onSetBbt={setBbt} />
              <DayMarkers
                section="bottom"
                days={active.days}
                month={active.meta.month}
                year={active.meta.year}
                usualMeasureTime={active.meta.usualMeasureTime}
                onUpdateDay={updateDay}
              />
            </div>
          </div>

          <ChartNotes meta={active.meta} onChange={setMeta} />
        </div>
      </main>
    </div>
  );
}
