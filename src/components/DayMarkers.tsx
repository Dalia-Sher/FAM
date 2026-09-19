import type { ReactNode } from 'react';
import type { DayEntry, MucusType } from '../types';
import { DAYS_COUNT } from '../types';
import {
  isFertileRelevant,
  lutealCountLabel,
  postPeakLabel,
  weekdayFromDate,
} from '../lib/helpers';

type Props = {
  days: DayEntry[];
  usualMeasureTime?: string;
  onUpdateDay: (dayIndex: number, patch: Partial<DayEntry>) => void;
  section: 'top' | 'bottom';
};

const MUCUS_OPTIONS: { value: MucusType | ''; label: string; short: string }[] = [
  { value: '', label: '—', short: '' },
  { value: 'eggwhite', label: 'דמוי חלבון־ביצה', short: 'ח׳ב' },
  { value: 'creamy', label: 'חלבי', short: 'חל' },
  { value: 'sticky', label: 'דביק', short: 'דב' },
  { value: 'period_dry_spot', label: 'וסת / יובש / הכתמה', short: 'ו/י' },
];

function DayCells({
  days,
  className,
  render,
}: {
  days: DayEntry[];
  className?: string;
  render: (day: DayEntry, i: number) => ReactNode;
}) {
  return (
    <div
      className={`day-cells ${className ?? ''}`}
      style={{ gridTemplateColumns: `repeat(${DAYS_COUNT}, var(--day-col))` }}
    >
      {Array.from({ length: DAYS_COUNT }, (_, i) => {
        const day = days[i] ?? {};
        const fertile = isFertileRelevant(day, i, days);
        return (
          <div key={i} className={`day-cell${fertile ? ' is-fertile' : ''}`}>
            {render(day, i)}
          </div>
        );
      })}
    </div>
  );
}

function MarkerRow({
  label,
  sticky,
  children,
}: {
  label: string;
  sticky?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={`marker-row${sticky ? ' sticky-days' : ''}`}>
      <div className="row-label sticky-label">{label}</div>
      {children}
    </div>
  );
}

export function DayMarkers({ days, usualMeasureTime, onUpdateDay, section }: Props) {
  if (section === 'top') {
    return (
      <div className="day-markers">
        <MarkerRow label="היום במחזור" sticky>
          <DayCells
            days={days}
            render={(_, i) => <span className="day-num">{i + 1}</span>}
          />
        </MarkerRow>

        <MarkerRow label="תאריך">
          <DayCells
            days={days}
            render={(day, i) => (
              <input
                type="date"
                className="cell-input"
                value={day.date ?? ''}
                onChange={(e) => onUpdateDay(i, { date: e.target.value || undefined })}
              />
            )}
          />
        </MarkerRow>

        <MarkerRow label="היום בשבוע">
          <DayCells
            days={days}
            render={(day) => (
              <span className="derived">{weekdayFromDate(day.date) || '·'}</span>
            )}
          />
        </MarkerRow>

        <MarkerRow label="שעת המדידה">
          <DayCells
            days={days}
            render={(day, i) => {
              const shown =
                day.measureTime ||
                (day.bbt != null && usualMeasureTime ? usualMeasureTime : '');
              const isDefault = !day.measureTime && !!shown;
              return (
                <input
                  type="time"
                  className={`cell-input${isDefault ? ' is-default' : ''}`}
                  value={shown}
                  onChange={(e) =>
                    onUpdateDay(i, { measureTime: e.target.value || undefined })
                  }
                  title={isDefault ? `ברירת מחדל: ${usualMeasureTime}` : undefined}
                />
              );
            }}
          />
        </MarkerRow>

        <MarkerRow label="ספירת ימי השלב הלוטאלי">
          <DayCells
            days={days}
            render={(day, i) => (
              <input
                type="text"
                inputMode="numeric"
                className="cell-input derived-edit"
                value={
                  day.lutealCountOverride != null
                    ? day.lutealCountOverride === 0
                      ? ''
                      : String(day.lutealCountOverride)
                    : lutealCountLabel(days, i)
                }
                onChange={(e) => {
                  const v = e.target.value.trim();
                  if (v === '') {
                    onUpdateDay(i, { lutealCountOverride: 0 });
                    return;
                  }
                  const n = Number(v);
                  if (Number.isFinite(n)) onUpdateDay(i, { lutealCountOverride: n });
                }}
                onDoubleClick={() => onUpdateDay(i, { lutealCountOverride: null })}
                title="לחיצה כפולה מאפסת לחישוב אוטומטי"
              />
            )}
          />
        </MarkerRow>

        <MarkerRow label="יום השיא וספירת ימים אחריו">
          <DayCells
            days={days}
            render={(_, i) => (
              <span className="derived">{postPeakLabel(days, i) || '·'}</span>
            )}
          />
        </MarkerRow>
      </div>
    );
  }

  return (
    <div className="day-markers">
      <MarkerRow label="אמצעי מניעה">
        <DayCells
          days={days}
          render={(day, i) => (
            <input
              type="text"
              className="cell-input"
              maxLength={4}
              value={day.contraception ?? ''}
              onChange={(e) =>
                onUpdateDay(i, { contraception: e.target.value || undefined })
              }
            />
          )}
        />
      </MarkerRow>

      <MarkerRow label="יחסי מין (עיגול)">
        <DayCells
          days={days}
          render={(day, i) => (
            <button
              type="button"
              className={`toggle-dot${day.intercourse ? ' on' : ''}`}
              aria-pressed={!!day.intercourse}
              onClick={() => onUpdateDay(i, { intercourse: !day.intercourse })}
              title="סמן יחסי מין"
            >
              {day.intercourse ? '●' : '○'}
            </button>
          )}
        />
      </MarkerRow>

      <MarkerRow label="ריר צוואר הרחם">
        <DayCells
          days={days}
          render={(day, i) => (
            <select
              className="cell-select"
              value={day.mucus ?? ''}
              onChange={(e) =>
                onUpdateDay(i, {
                  mucus: (e.target.value || undefined) as MucusType | undefined,
                })
              }
              title={MUCUS_OPTIONS.find((o) => o.value === (day.mucus ?? ''))?.label}
            >
              {MUCUS_OPTIONS.map((o) => (
                <option key={o.value || 'none'} value={o.value}>
                  {o.short || '—'}
                </option>
              ))}
            </select>
          )}
        />
      </MarkerRow>

      <MarkerRow label="יום השיא">
        <DayCells
          days={days}
          render={(day, i) => (
            <button
              type="button"
              className={`toggle-dot peak${day.peakDay ? ' on' : ''}`}
              aria-pressed={!!day.peakDay}
              onClick={() =>
                onUpdateDay(i, { peakDay: day.peakDay ? false : true })
              }
            >
              {day.peakDay ? 'יש' : '·'}
            </button>
          )}
        />
      </MarkerRow>

      <MarkerRow label="תחושה בנרתיק">
        <DayCells
          days={days}
          render={(day, i) => (
            <input
              type="text"
              className="cell-input"
              maxLength={6}
              value={day.sensation ?? ''}
              onChange={(e) =>
                onUpdateDay(i, { sensation: e.target.value || undefined })
              }
              placeholder="לח/יבש"
            />
          )}
        />
      </MarkerRow>

      <MarkerRow label="צוואר הרחם (ק/ב/ר…)">
        <DayCells
          days={days}
          render={(day, i) => (
            <input
              type="text"
              className="cell-input"
              maxLength={4}
              value={day.cervix ?? ''}
              onChange={(e) => onUpdateDay(i, { cervix: e.target.value || undefined })}
              placeholder="קבר"
            />
          )}
        />
      </MarkerRow>

      <MarkerRow label="כאבי ביוץ">
        <DayCells
          days={days}
          render={(day, i) => (
            <button
              type="button"
              className={`toggle-dot${day.ovulationPain ? ' on' : ''}`}
              aria-pressed={!!day.ovulationPain}
              onClick={() => onUpdateDay(i, { ovulationPain: !day.ovulationPain })}
            >
              {day.ovulationPain ? '✕' : '·'}
            </button>
          )}
        />
      </MarkerRow>
    </div>
  );
}
