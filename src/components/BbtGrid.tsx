import { useMemo } from 'react';
import type { DayEntry } from '../types';
import { bbtLevels, DAYS_COUNT } from '../types';
import { isFertileRelevant } from '../lib/helpers';

type Props = {
  days: DayEntry[];
  onSetBbt: (dayIndex: number, bbt: number | undefined) => void;
};

export function BbtGrid({ days, onSetBbt }: Props) {
  const levels = useMemo(() => bbtLevels(), []);

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
    const cellW = 1;
    const cellH = 1;
    return points
      .map((p, i) => {
        const x = p.col * cellW + cellW / 2;
        const y = p.row * cellH + cellH / 2;
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');
  }, [points]);

  return (
    <div className="bbt-block">
      <div className="row-label sticky-label">חום השחר (°C)</div>
      <div className="bbt-grid-wrap">
        <div className="bbt-y-axis" aria-hidden>
          {levels.map((t) => (
            <div key={t} className="bbt-y-tick">
              {t.toFixed(2)}
            </div>
          ))}
        </div>
        <div
          className="bbt-grid"
          style={{
            gridTemplateColumns: `repeat(${DAYS_COUNT}, var(--day-col))`,
            gridTemplateRows: `repeat(${levels.length}, var(--bbt-row))`,
          }}
        >
          <svg
            className="bbt-line"
            viewBox={`0 0 ${DAYS_COUNT} ${levels.length}`}
            preserveAspectRatio="none"
            aria-hidden
          >
            {linePath && (
              <path d={linePath} fill="none" stroke="currentColor" strokeWidth="0.08" />
            )}
            {points.map((p) => (
              <circle
                key={p.col}
                cx={p.col + 0.5}
                cy={p.row + 0.5}
                r="0.22"
                fill="currentColor"
              />
            ))}
          </svg>
          {levels.map((temp, row) =>
            Array.from({ length: DAYS_COUNT }, (_, col) => {
              const day = days[col] ?? {};
              const active = day.bbt != null && Math.abs(day.bbt - temp) < 0.001;
              const fertile = isFertileRelevant(day, col, days);
              return (
                <button
                  key={`${row}-${col}`}
                  type="button"
                  className={`bbt-cell${active ? ' is-active' : ''}${fertile ? ' is-fertile' : ''}`}
                  style={{ gridColumn: col + 1, gridRow: row + 1 }}
                  title={`יום ${col + 1}: ${temp.toFixed(2)}°C`}
                  aria-label={`יום ${col + 1}, חום ${temp.toFixed(2)}`}
                  aria-pressed={active}
                  onClick={() => onSetBbt(col, active ? undefined : temp)}
                />
              );
            }),
          )}
        </div>
      </div>
    </div>
  );
}
