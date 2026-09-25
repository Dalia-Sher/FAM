import { useEffect, useMemo, useState } from 'react';
import type { DayEntry } from '../types';
import { BBT_MAX, BBT_MIN, BBT_STEP, bbtLevels, DAYS_COUNT } from '../types';
import { isFertileRelevant } from '../lib/helpers';

type Props = {
  days: DayEntry[];
  onSetBbt: (dayIndex: number, bbt: number | undefined) => void;
};

function snapBbt(n: number): number | undefined {
  if (!Number.isFinite(n)) return undefined;
  if (n < BBT_MIN - BBT_STEP / 2 || n > BBT_MAX + BBT_STEP / 2) return undefined;
  const snapped = Math.round(n / BBT_STEP) * BBT_STEP;
  return Math.round(snapped * 100) / 100;
}

function nearestRow(levels: number[], temp: number): number {
  let best = 0;
  let bestDist = Infinity;
  for (let i = 0; i < levels.length; i++) {
    const d = Math.abs(levels[i]! - temp);
    if (d < bestDist) {
      bestDist = d;
      best = i;
    }
  }
  return best;
}

function TempInput({
  dayIndex,
  bbt,
  onSetBbt,
}: {
  dayIndex: number;
  bbt?: number;
  onSetBbt: (dayIndex: number, bbt: number | undefined) => void;
}) {
  const [draft, setDraft] = useState(() => (bbt != null ? bbt.toFixed(2) : ''));

  useEffect(() => {
    setDraft(bbt != null ? bbt.toFixed(2) : '');
  }, [bbt]);

  return (
    <input
      type="text"
      inputMode="decimal"
      className="cell-input"
      placeholder=""
      value={draft}
      title={`יום ${dayIndex + 1} — הזיני טמפרטורה`}
      aria-label={`טמפרטורה ליום ${dayIndex + 1}`}
      onChange={(e) => setDraft(e.target.value.replace(',', '.'))}
      onBlur={() => {
        const v = draft.trim();
        if (v === '') {
          onSetBbt(dayIndex, undefined);
          setDraft('');
          return;
        }
        const snapped = snapBbt(Number(v));
        if (snapped == null) {
          setDraft(bbt != null ? bbt.toFixed(2) : '');
          return;
        }
        onSetBbt(dayIndex, snapped);
        setDraft(snapped.toFixed(2));
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          (e.target as HTMLInputElement).blur();
        }
      }}
    />
  );
}

export function BbtGrid({ days, onSetBbt }: Props) {
  const levels = useMemo(() => bbtLevels(), []);

  const points = useMemo(() => {
    return days
      .map((d, i) => {
        if (d.bbt == null) return null;
        return { col: i, row: nearestRow(levels, d.bbt), temp: d.bbt };
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

  return (
    <>
      <div className="bbt-block">
        <div className="row-label sticky-label">
          חום השחר (°C)
          <span className="bbt-hint">הזיני טמפ׳ בשורה למטה — העיגול יופיע כאן</span>
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
            className="bbt-grid bbt-grid-readonly"
            role="img"
            aria-label="רשת חום שחר — מוצגת לפי הטמפרטורות שהוזנו למטה"
            style={{
              height: `calc(${levels.length} * var(--bbt-row))`,
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
          טמפ׳ (°C)
          <span className="bbt-hint">תא ריק = הזנה ידנית · בטל למחיקה</span>
        </div>
        <div className="axis-gutter" aria-hidden />
        <div className="day-cells">
          {Array.from({ length: DAYS_COUNT }, (_, i) => {
            const bbt = days[i]?.bbt;
            return (
              <div
                key={i}
                className={`day-cell bbt-value-cell${bbt != null ? ' has-value' : ''}`}
              >
                <TempInput dayIndex={i} bbt={bbt} onSetBbt={onSetBbt} />
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
