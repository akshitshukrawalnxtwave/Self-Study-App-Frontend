import type { LearningMaterialSummary, LessonSummary } from '../../types/api';
import { sameWorkspaceFileUrl, titleFromLessonUrl } from '../../utils/lessonUrls';

type LessonRailProps = {
  title: string;
  lessons: LessonSummary[];
  materials: LearningMaterialSummary[];
  selectedUrl: string | null;
  onSelectLesson: (url: string) => void;
  onSelectMaterial: (url: string) => void;
  lessonsLoading?: boolean;
  materialsLoading?: boolean;
};

function lessonTitle(lesson: LessonSummary): string {
  return lesson.title || titleFromLessonUrl(lesson.url);
}

function materialTitle(material: LearningMaterialSummary): string {
  return material.title || titleFromLessonUrl(material.path ?? material.url);
}

function lessonNumberLabel(lesson: LessonSummary, index: number): string {
  const source = lesson.path ?? lesson.url;
  const match = source.match(/(\d{3,4})/);
  const num = match?.[1] ?? String(index + 1).padStart(4, '0');
  return `LESSON ${num}`;
}

function nodeState(
  index: number,
  selectedIndex: number,
  total: number,
): 'done' | 'now' | 'upcoming' {
  if (selectedIndex < 0) {
    if (index === total - 1) return 'now';
    return index < total - 1 ? 'done' : 'upcoming';
  }
  if (index < selectedIndex) return 'done';
  if (index === selectedIndex) return 'now';
  return 'upcoming';
}

const CheckIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M20 6L9 17l-5-5" />
  </svg>
);

const FileIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M4 4h11l5 5v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z" />
    <path d="M14 4v5h5" />
  </svg>
);

const StarIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M12 2l2.4 7.4H22l-6 4.5 2.3 7.1L12 16.5 5.7 21l2.3-7.1-6-4.5h7.6z" />
  </svg>
);

export function LessonRail({
  title,
  lessons,
  materials,
  selectedUrl,
  onSelectLesson,
  onSelectMaterial,
  lessonsLoading,
  materialsLoading,
}: LessonRailProps) {
  const selectedIndex = lessons.findIndex((lesson) =>
    sameWorkspaceFileUrl(selectedUrl, lesson.url),
  );

  const references = materials.filter((m) => m.kind === 'reference' || m.kind === 'resource');
  const otherMaterials = materials.filter((m) => m.kind !== 'reference' && m.kind !== 'resource');

  return (
    <aside className="rail">
      <div className="rail-head">
        <span className="rail-eyebrow">Your lesson thread</span>
      </div>

      <div className="rail-scroll">
        <div className="mission">
          <span className="mission__pin">{StarIcon}</span>
          <div>
            <div className="mission__label">Mission</div>
            <div className="mission__text">{title}</div>
          </div>
        </div>

        {lessonsLoading ? (
          <p className="rail-empty">Loading lessons…</p>
        ) : lessons.length === 0 ? (
          <p className="rail-empty">Lessons will appear here as your assistant writes them.</p>
        ) : (
          <nav className="thread" aria-label="Lessons">
            {lessons.map((lesson, index) => {
              const state = nodeState(index, selectedIndex, lessons.length);
              const isSelected = sameWorkspaceFileUrl(selectedUrl, lesson.url);
              const noLabel =
                state === 'now'
                  ? `${lessonNumberLabel(lesson, index)} · NOW`
                  : state === 'upcoming' && index === selectedIndex + 1
                    ? 'UP NEXT'
                    : lessonNumberLabel(lesson, index);
              const isLast = index === lessons.length - 1;

              return (
                <button
                  key={lesson.id ?? lesson.path ?? lesson.url}
                  type="button"
                  className={`node node--${state}${isSelected ? ' node--selected' : ''}`}
                  onClick={() => onSelectLesson(lesson.url)}
                >
                  <span className="node__rail">
                    <span className="node__mark">
                      {state === 'done' ? CheckIcon : state === 'now' ? <span className="node__pulse" /> : null}
                    </span>
                    {!isLast ? (
                      <span
                        className={`node__connector${state === 'done' ? ' node__connector--done' : ''}`}
                        aria-hidden
                      />
                    ) : null}
                  </span>
                  <span className="node__body">
                    <span className="node__no">{noLabel}</span>
                    <span className="node__ttl">{lessonTitle(lesson)}</span>
                  </span>
                </button>
              );
            })}
          </nav>
        )}

        {(references.length > 0 || otherMaterials.length > 0 || materialsLoading) && (
          <>
            <div className="rail-section">Reference sheets</div>
            {materialsLoading ? (
              <p className="rail-empty">Loading…</p>
            ) : (
              <>
                {[...references, ...otherMaterials].map((material) => (
                  <button
                    key={material.id ?? material.path ?? material.url}
                    type="button"
                    className={`ref-link${sameWorkspaceFileUrl(selectedUrl, material.url) ? ' ref-link--active' : ''}`}
                    onClick={() => onSelectMaterial(material.url)}
                  >
                    {FileIcon}
                    <span>{materialTitle(material)}</span>
                  </button>
                ))}
              </>
            )}
          </>
        )}
      </div>
    </aside>
  );
}
