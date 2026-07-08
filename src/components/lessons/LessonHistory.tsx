type LessonHistoryProps = {
  lessons: string[];
  selectedUrl: string | null;
  onSelect: (url: string) => void;
  isLoading?: boolean;
};

function lessonLabel(url: string): string {
  const filename = url.split('/').pop() ?? url;
  return filename.replace('.html', '').replace(/^\d+-/, '');
}

export function LessonHistory({
  lessons,
  selectedUrl,
  onSelect,
  isLoading,
}: LessonHistoryProps) {
  if (isLoading) {
    return (
      <div className="lesson-history">
        <h3 className="lesson-history__title">Lessons</h3>
        <p className="lesson-history__empty">Loading…</p>
      </div>
    );
  }

  if (lessons.length === 0) {
    return (
      <div className="lesson-history">
        <h3 className="lesson-history__title">Lessons</h3>
        <p className="lesson-history__empty">No lessons yet</p>
      </div>
    );
  }

  return (
    <div className="lesson-history">
      <h3 className="lesson-history__title">Lessons</h3>
      <ul className="lesson-history__list">
        {lessons.map((url) => (
          <li key={url}>
            <button
              type="button"
              className={`lesson-history__item${selectedUrl === url ? ' lesson-history__item--active' : ''}`}
              onClick={() => onSelect(url)}
            >
              {lessonLabel(url)}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
