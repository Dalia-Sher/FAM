import { useMemo, useRef } from 'react';
import type { DayEntry } from '../types';
import { bbtLevels, DAYS_COUNT } from '../types';
import { isFertileRelevant } from '../lib/helpers';

type Props = {
  days: DayEntry[];
  onSetBbt: (dayIndex: number, bbt: number | undefined) => void;
};

export function BbtGrid({ days, onSetBbt }: Props) {
  const levels = useMemo(() => bbtLevels(), []);
  const gridRef = useRef<HTMLDivElement>(null);

  const points = useMemo(() => {
    return days
      .map((d, i) => {
        if (d.bbt == null) return null;
        const row = levels.findIndex((l) => Math.abs(l - d.bbt!) < 0.001);
        if (row < 0) return null;
        return { col: i, row, temp: d.bbt };
      })
      .filter(Boolean) as { col: number; row: number; temp: number }[];
  }, [days, levels]);

  const linePath = useMemo(() => {
    if (points.length < 2) return '';
    return points
      .map((p, i) => {
        const x = p.col + 0.5;
        const y = p.row + 0.5;
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');
  }, [points]);

  const pickFromEvent = (clientX: number, clientY: number) => {
    const el = gridRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    // Element is scaleX(-1); getBoundingClientRect is in screen space.
    // Screen left = day 40, screen right = day 1.
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    if (x < 0 || y < 0 || x > rect.width || y > rect.height) return;

    const colW = rect.width / DAYS_COUNT;
    const rowH = rect.height / levels.length;
    const visualCol = Math.max(0, Math.min(DAYS_COUNT - 1, Math.floor(x / colW)));
    const col = DAYS_COUNT - 1 - visualCol;
    const row = Math.max(0, Math.min(levels.length - 1, Math.floor(y / rowH)));
    const temp = levels[row];
    const current = days[col]?.bbt;

    if (current != null) {
      const currentRow = levels.findIndex((l) => Math.abs(l - current) < 0.001);
      if (currentRow >= 0 && Math.abs(currentRow - row) <= 2) {
        onSetBbt(col, undefined);
        return;
      }
    }

    onSetBbt(col, temp);
  };

  return (
    <>
      <div className="bbt-block">
        <div className="row-label sticky-label">
          חום השחר (°C)
          <span className="bbt-hint">לחצי לסימון · לחצי שוב על הנקודה לביטול</span>
        </div>
        <div className="bbt-y-axis" aria-hidden>
          {levels.map((t) => (
            <div key={t} className="bbt-y-tick">
              {t.toFixed(2)}
            </div>
          ))}
        </div>
        <div className="bbt-grid-wrap">
          <div
            ref={gridRef}
            className="bbt-grid"
            role="img"
            aria-label="רשת חום שחר — לחצי כדי לסמן טמפרטורה"
            style={{
              height: `calc(${levels.length} * var(--bbt-row))`,
            }}
            onPointerDown={(e) => {
              if (e.pointerType === 'touch') e.preventDefault();
              pickFromEvent(e.clientX, e.clientY);
            }}
          >
            <div className="bbt-fertile-cols" aria-hidden>
              {days.map((day, col) =>
                isFertileRelevant(day, col, days) ? (
                  <div
                    key={col}
                    className="bbt-fertile-col"
                    style={{
                      left: `calc(${col} * var(--day-col))`,
                      width: 'var(--day-col)',
                    }}
                  />
                ) : null,
              )}
            </div>

            <svg
              className="bbt-line"
              viewBox={`0 0 ${DAYS_COUNT} ${levels.length}`}
              preserveAspectRatio="none"
              aria-hidden
            >
              {linePath && (
                <path
                  d={linePath}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="0.12"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              )}
              {points.map((p) => (
                <circle
                  key={p.col}
                  cx={p.col + 0.5}
                  cy={p.row + 0.5}
                  r="0.28"
                  fill="currentColor"
                  stroke="#f7f2e8"
                  strokeWidth="0.06"
                />
              ))}
            </svg>
          </div>
        </div>
      </div>

      <div className="bbt-values-row">
        <div className="row-label sticky-label">
          טמפ׳ שנבחרה
          <span className="bbt-hint">לחצי בטל כדי למחוק</span>
        </div>
        <div className="axis-gutter" aria-hidden />
        <div className="day-cells">
          {Array.from({ length: DAYS_COUNT }, (_, i) => {
            const bbt = days[i]?.bbt;
            return (
              <div
                key={i}
                className={`day-cell bbt-value-cell${bbt != null ? ' has-value' : ''}`}
                style={{ gridColumn: DAYS_COUNT - i }}
              >
                <input
                  type="text"
                  inputMode="decimal"
                  className="cell-input"
                  placeholder="—"
                  value={bbt ?? ''}
                  title={`יום ${i + 1}`}
                  onChange={(e) => {
                    const v = e.target.value.trim().replace(',', '.');
                    if (v === '') {
                      onSetBbt(i, undefined);
                      return;
                    }
                    const n = Number(v);
                    if (!Number.isFinite(n)) return;
                    const rounded = Math.round(n * 20) / 20;
                    if (rounded < 36.05 || rounded > 37.1) return;
                    onSetBbt(i, rounded);
                  }}
                />
                {bbt != null ? (
                  <button
                    type="button"
                    className="bbt-clear"
                    title={`בטלי טמפרטורה ליום ${i + 1}`}
                    aria-label={`בטלי טמפרטורה ליום ${i + 1}`}
                    onClick={() => onSetBbt(i, undefined)}
                  >
                    בטל
                  </button>
                ) : (
                  <span className="bbt-clear-placeholder"> </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
