import type { CycleMeta } from '../types';

type Props = {
  meta: CycleMeta;
  onChange: (meta: CycleMeta) => void;
};

export function ChartNotes({ meta, onChange }: Props) {
  const set = (key: keyof CycleMeta, value: string) => {
    onChange({ ...meta, [key]: value || undefined });
  };

  return (
    <section className="chart-notes">
      <h2>הערות והפרעות</h2>
      <div className="notes-grid">
        <label className="notes-full">
          הערות (נסיעות/יציאות חריגות/נסיעות/מחלות וכו)
          <textarea
            rows={3}
            name="fam-notes"
            autoComplete="off"
            autoCorrect="off"
            value={meta.notes ?? ''}
            onChange={(e) => set('notes', e.target.value)}
          />
        </label>
      </div>

      <aside className="mucus-legend">
        <h3>תיאור של נוזלי צוואר הרחם</h3>
        <ul>
          <li>
            <strong>חלקלק, מתיח, דמוי חלבון ביצה:</strong> שקוף/פסים לבנים/אטום, ג׳ל,
            מיימי, תחושת סיכוך, תחושה רטובה או לחה.
          </li>
          <li>
            <strong>קרמי, חלבי, חלק:</strong> לבן או צהוב, תחושה רטובה, לחה או קרירה.
          </li>
          <li>
            <strong>בצקי, פירורי, אטום · דביק:</strong> תחושה יבשה או דביקה.
          </li>
          <li>
            <strong>וסת:</strong> דימום וסתי.
          </li>
          <li>
            <strong>הכתמה:</strong> דימום קל / כתמים שאינם וסת מלאה.
          </li>
          <li>
            <strong>יבש:</strong> ללא ריר מורגש / תחושת יובש.
          </li>
        </ul>
      </aside>
    </section>
  );
}
