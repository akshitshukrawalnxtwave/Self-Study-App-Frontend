import type { LessonSummary } from '../../types/api';
import { sameWorkspaceFileUrl, titleFromLessonUrl } from '../../utils/lessonUrls';

type LessonHistoryProps = {
  lessons: LessonSummary[];
  selectedUrl: string | null;
  onSelect: (url: string) => void;
  isLoading?: boolean;
};

function lessonLabel(lesson: LessonSummary): string {
  if (lesson.title) {
    return lesson.title;
  }
  return titleFromLessonUrl(lesson.url);
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
        {lessons.map((lesson) => (
          <li key={lesson.id ?? lesson.path ?? lesson.url}>
            <button
              type="button"
              className={`lesson-history__item${sameWorkspaceFileUrl(selectedUrl, lesson.url) ? ' lesson-history__item--active' : ''}`}
              onClick={() => onSelect(lesson.url)}
            >
              {lessonLabel(lesson)}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
