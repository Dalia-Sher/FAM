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
        <label>
          פעילות גופנית
          <input
            type="text"
            value={meta.exercise ?? ''}
            onChange={(e) => set('exercise', e.target.value)}
          />
        </label>
        <label>
          נסיעות
          <input
            type="text"
            value={meta.travel ?? ''}
            onChange={(e) => set('travel', e.target.value)}
          />
        </label>
        <label>
          מחלה / מתח
          <input
            type="text"
            value={meta.illnessStress ?? ''}
            onChange={(e) => set('illnessStress', e.target.value)}
          />
        </label>
        <label>
          תסמונת קדם־וסתית
          <input
            type="text"
            value={meta.pms ?? ''}
            onChange={(e) => set('pms', e.target.value)}
          />
        </label>
        <label>
          בדיקת שד עצמית
          <input
            type="text"
            value={meta.breastExam ?? ''}
            onChange={(e) => set('breastExam', e.target.value)}
          />
        </label>
        <label>
          צמחי מרפא, ויטמינים
          <input
            type="text"
            value={meta.herbsVitamins ?? ''}
            onChange={(e) => set('herbsVitamins', e.target.value)}
          />
        </label>
        <label>
          תוספי תזונה
          <input
            type="text"
            value={meta.supplements ?? ''}
            onChange={(e) => set('supplements', e.target.value)}
          />
        </label>
        <label className="notes-full">
          הערות
          <textarea
            rows={3}
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
            <strong>יבש:</strong> ללא ריר מורגש / תחושת יובש.
          </li>
        </ul>
      </aside>
    </section>
  );
}
