import type { CycleMeta } from '../types';

type Props = {
  meta: CycleMeta;
  onChange: (meta: CycleMeta) => void;
};

export function ChartHeader({ meta, onChange }: Props) {
  const set = <K extends keyof CycleMeta>(key: K, value: CycleMeta[K]) => {
    onChange({ ...meta, [key]: value });
  };

  const num = (v: string) => {
    if (v === '') return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  };

  return (
    <header className="chart-header">
      <div className="chart-brand">
        <h1>מניעת הריון</h1>
        <p className="chart-subtitle">טבלת מעקב שמ״פ · שיטת המודעות לפוריות</p>
      </div>

      <div className="meta-grid">
        <label>
          מחזור מס׳
          <input
            type="number"
            min={1}
            value={meta.cycleNumber ?? ''}
            onChange={(e) => set('cycleNumber', num(e.target.value))}
          />
        </label>
        <label>
          גיל
          <input
            type="number"
            min={1}
            value={meta.age ?? ''}
            onChange={(e) => set('age', num(e.target.value))}
          />
        </label>
        <label>
          חודש
          <input
            type="text"
            inputMode="numeric"
            placeholder="1–12 או שם חודש"
            value={meta.month ?? ''}
            onChange={(e) => set('month', e.target.value || undefined)}
            title="מספר חודש (1–12) או שם בעברית/אנגלית — לחישוב יום בשבוע"
          />
        </label>
        <label>
          שנה
          <input
            type="text"
            inputMode="numeric"
            placeholder="2026"
            value={meta.year ?? ''}
            onChange={(e) => set('year', e.target.value || undefined)}
          />
        </label>
        <label>
          אורך מחזור זה
          <input
            type="number"
            min={1}
            value={meta.cycleLength ?? ''}
            onChange={(e) => set('cycleLength', num(e.target.value))}
          />
        </label>
        <label>
          אורך שלב לוטאלי במחזור זה
          <input
            type="number"
            min={1}
            value={meta.lutealLength ?? ''}
            onChange={(e) => set('lutealLength', num(e.target.value))}
          />
        </label>
        <label>
          הקצר ביותר (12 אחרונים)
          <input
            type="number"
            min={1}
            value={meta.shortest ?? ''}
            onChange={(e) => set('shortest', num(e.target.value))}
          />
        </label>
        <label>
          הארוך ביותר (12 אחרונים)
          <input
            type="number"
            min={1}
            value={meta.longest ?? ''}
            onChange={(e) => set('longest', num(e.target.value))}
          />
        </label>
        <label className="meta-span">
          שעת מדידה בד״כ
          <input
            type="time"
            value={meta.usualMeasureTime ?? ''}
            onChange={(e) => set('usualMeasureTime', e.target.value || undefined)}
          />
        </label>
      </div>
    </header>
  );
}
