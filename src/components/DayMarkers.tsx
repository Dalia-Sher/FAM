import { useEffect, useState, type ReactNode } from 'react';
import type { DayEntry, MucusType } from '../types';
import { DAYS_COUNT } from '../types';
import {
  dayOfMonthValue,
  findPeakDayIndex,
  isFertileRelevant,
  lutealCountLabel,
  postPeakLabel,
  weekdayForCycleDay,
} from '../lib/helpers';

type Props = {
  days: DayEntry[];
  month?: string;
  year?: string;
  usualMeasureTime?: string;
  onUpdateDay: (dayIndex: number, patch: Partial<DayEntry>) => void;
  section: 'top' | 'bottom';
  dayCount?: number;
  /** When true (print/PDF), show plain values instead of form controls. */
  plainValues?: boolean;
};

const MUCUS_OPTIONS: { value: MucusType | ''; label: string; short: string }[] = [
  { value: '', label: '—', short: '' },
  { value: 'eggwhite', label: 'דמוי חלבון־ביצה', short: 'ח׳ב' },
  { value: 'creamy', label: 'חלבי', short: 'חל' },
  { value: 'sticky', label: 'דביק', short: 'דב' },
  { value: 'period', label: 'וסת', short: 'וסת' },
  { value: 'spotting', label: 'הכתמה', short: 'הכתמה' },
  { value: 'dry', label: 'יבש', short: 'יבש' },
];

/** Text + numeric keypad; commit on blur so iOS autofill gets the full day number. */
function DayOfMonthInput({
  dayIndex,
  date,
  onUpdateDay,
}: {
  dayIndex: number;
  date?: string;
  onUpdateDay: (dayIndex: number, patch: Partial<DayEntry>) => void;
}) {
  const stored = dayOfMonthValue(date);
  const [draft, setDraft] = useState(stored);

  useEffect(() => {
    setDraft(stored);
  }, [stored]);

  const commit = () => {
    const v = draft.trim();
    if (v === '') {
      onUpdateDay(dayIndex, { date: undefined });
      setDraft('');
      return;
    }
    const n = Number(v);
    if (!Number.isFinite(n) || n < 1 || n > 31) {
      setDraft(stored);
      return;
    }
    const next = String(n);
    onUpdateDay(dayIndex, { date: next });
    setDraft(next);
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      enterKeyHint="done"
      className="cell-input"
      placeholder="יום"
      value={draft}
      onChange={(e) =>
        setDraft(e.target.value.replace(/[^\d]/g, '').slice(0, 2))
      }
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
      }}
      title="מספר היום בחודש (1–31). ביום הראשון — אחרי Enter/סיום, 30 הימים הבאים מתמלאים לפי חודש/שנה."
    />
  );
}

function DayCells({
  days,
  dayCount = DAYS_COUNT,
  className,
  render,
}: {
  days: DayEntry[];
  dayCount?: number;
  className?: string;
  render: (day: DayEntry, i: number) => ReactNode;
}) {
  return (
    <div className={`day-cells ${className ?? ''}`}>
      {Array.from({ length: dayCount }, (_, i) => {
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
      <div className="axis-gutter" aria-hidden />
      {children}
    </div>
  );
}

export function DayMarkers({
  days,
  month,
  year,
  usualMeasureTime,
  onUpdateDay,
  section,
  dayCount = DAYS_COUNT,
  plainValues = false,
}: Props) {
  if (section === 'top') {
    return (
      <div className="day-markers">
        <MarkerRow label="היום במחזור" sticky={!plainValues}>
          <DayCells
            days={days}
            dayCount={dayCount}
            render={(_, i) => <span className="day-num">{i + 1}</span>}
          />
        </MarkerRow>

        <MarkerRow label="תאריך (יום בחודש)">
          <DayCells
            days={days}
            dayCount={dayCount}
            render={(day, i) =>
              plainValues ? (
                <span className="cell-print-value">
                  {dayOfMonthValue(day.date) || '·'}
                </span>
              ) : (
                <DayOfMonthInput
                  dayIndex={i}
                  date={day.date}
                  onUpdateDay={onUpdateDay}
                />
              )
            }
          />
        </MarkerRow>

        <MarkerRow label="היום בשבוע">
          <DayCells
            days={days}
            dayCount={dayCount}
            render={(_, i) => (
              <span className="derived">
                {weekdayForCycleDay(days, i, month, year) || '·'}
              </span>
            )}
          />
        </MarkerRow>

        <MarkerRow label="שעת המדידה">
          <DayCells
            days={days}
            dayCount={dayCount}
            render={(day, i) => {
              const shown =
                day.measureTime ||
                (day.bbt != null && usualMeasureTime ? usualMeasureTime : '');
              const isDefault = !day.measureTime && !!shown;
              if (plainValues) {
                return (
                  <span className="cell-print-value cell-print-time">
                    {shown || '·'}
                  </span>
                );
              }
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
            dayCount={dayCount}
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
                title="אוטומטי מיום עליית החום (כמו הקו המפריד). לחיצה כפולה מחזירה לחישוב אוטומטי."
              />
            )}
          />
        </MarkerRow>

        <MarkerRow label="יום השיא וספירת ימים אחריו">
          <DayCells
            days={days}
            dayCount={dayCount}
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
          dayCount={dayCount}
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
          dayCount={dayCount}
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
          dayCount={dayCount}
          render={(day, i) => {
            const opt = MUCUS_OPTIONS.find((o) => o.value === (day.mucus ?? ''));
            const short = opt?.short || '—';
            if (plainValues) {
              return <span className="cell-print-value">{short}</span>;
            }
            return (
              <select
                className="cell-select"
                value={day.mucus ?? ''}
                onChange={(e) =>
                  onUpdateDay(i, {
                    mucus: (e.target.value || undefined) as MucusType | undefined,
                  })
                }
                title={opt?.label}
              >
                {MUCUS_OPTIONS.map((o) => (
                  <option key={o.value || 'none'} value={o.value}>
                    {o.short || '—'}
                  </option>
                ))}
              </select>
            );
          }}
        />
      </MarkerRow>

      <MarkerRow label="יום השיא">
        <DayCells
          days={days}
          dayCount={dayCount}
          render={(day, i) => {
            const peak = findPeakDayIndex(days);
            const isPeak = peak === i;
            return (
              <button
                type="button"
                className={`toggle-dot peak${isPeak ? ' on' : ''}`}
                aria-pressed={isPeak}
                onClick={() =>
                  onUpdateDay(i, { peakDay: day.peakDay ? false : true })
                }
                onDoubleClick={() => {
                  days.forEach((d, idx) => {
                    if (d.peakDay) onUpdateDay(idx, { peakDay: false });
                  });
                }}
                title="אוטומטי לפי ריר/תחושת סיכוך (היום האחרון לפני ייבוש). לחיצה = סימון ידני; לחיצה כפולה = חזרה לאוטומטי."
              >
                {isPeak ? 'יש' : '·'}
              </button>
            );
          }}
        />
      </MarkerRow>

      <MarkerRow label="תחושה בנרתיק">
        <DayCells
          days={days}
          dayCount={dayCount}
          render={(day, i) => (
            <input
              type="text"
              className="cell-input"
              maxLength={8}
              value={day.sensation ?? ''}
              onChange={(e) =>
                onUpdateDay(i, { sensation: e.target.value || undefined })
              }
              placeholder="סיכוך/לח"
            />
          )}
        />
      </MarkerRow>

      <MarkerRow label="צוואר הרחם (ק/ב/ר…)">
        <DayCells
          days={days}
          dayCount={dayCount}
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
          dayCount={dayCount}
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
