import type { LearningMaterialSummary, LessonSummary } from '../../types/api';
import { sameWorkspaceFileUrl, titleFromLessonUrl } from '../../utils/lessonUrls';

export type ContentPanelTab = 'lessons' | 'materials';

type ContentPanelProps = {
  activeTab: ContentPanelTab;
  onTabChange: (tab: ContentPanelTab) => void;
  lessons: LessonSummary[];
  materials: LearningMaterialSummary[];
  selectedUrl: string | null;
  onSelect: (url: string) => void;
  lessonsLoading?: boolean;
  materialsLoading?: boolean;
};

function lessonLabel(lesson: LessonSummary): string {
  if (lesson.title) {
    return lesson.title;
  }
  return titleFromLessonUrl(lesson.url);
}

function materialLabel(material: LearningMaterialSummary): string {
  if (material.title) {
    return material.title;
  }
  return titleFromLessonUrl(material.path ?? material.url);
}

function kindLabel(kind: LearningMaterialSummary['kind']): string {
  switch (kind) {
    case 'reference':
      return 'Reference';
    case 'learning_record':
      return 'Record';
    case 'resource':
      return 'Resource';
    default:
      return kind;
  }
}

export function ContentPanel({
  activeTab,
  onTabChange,
  lessons,
  materials,
  selectedUrl,
  onSelect,
  lessonsLoading,
  materialsLoading,
}: ContentPanelProps) {
  const isLoading = activeTab === 'lessons' ? lessonsLoading : materialsLoading;
  const items = activeTab === 'lessons' ? lessons : materials;
  const emptyLabel =
    activeTab === 'lessons' ? 'No lessons yet' : 'No learning material yet';

  return (
    <div className="content-panel">
      <div className="content-panel__tabs" role="tablist" aria-label="Lesson panel">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'lessons'}
          className={`content-panel__tab${activeTab === 'lessons' ? ' content-panel__tab--active' : ''}`}
          onClick={() => onTabChange('lessons')}
        >
          Lessons
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'materials'}
          className={`content-panel__tab${activeTab === 'materials' ? ' content-panel__tab--active' : ''}`}
          onClick={() => onTabChange('materials')}
        >
          Learning material
        </button>
      </div>

      {isLoading ? (
        <p className="content-panel__empty">Loading…</p>
      ) : items.length === 0 ? (
        <p className="content-panel__empty">{emptyLabel}</p>
      ) : (
        <ul className="content-panel__list">
          {activeTab === 'lessons'
            ? lessons.map((lesson) => (
                <li key={lesson.id ?? lesson.path ?? lesson.url}>
                  <button
                    type="button"
                    className={`content-panel__item${sameWorkspaceFileUrl(selectedUrl, lesson.url) ? ' content-panel__item--active' : ''}`}
                    onClick={() => onSelect(lesson.url)}
                  >
                    {lessonLabel(lesson)}
                  </button>
                </li>
              ))
            : materials.map((material) => (
                <li key={material.id ?? material.path ?? material.url}>
                  <button
                    type="button"
                    className={`content-panel__item${sameWorkspaceFileUrl(selectedUrl, material.url) ? ' content-panel__item--active' : ''}`}
                    onClick={() => onSelect(material.url)}
                  >
                    <span className="content-panel__item-label">{materialLabel(material)}</span>
                    <span className="content-panel__item-kind">{kindLabel(material.kind)}</span>
                  </button>
                </li>
              ))}
        </ul>
      )}
    </div>
  );
}
