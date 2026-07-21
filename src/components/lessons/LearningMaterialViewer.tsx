import type { LearningMaterialFormat } from '../../types/api';
import { LessonViewer } from './LessonViewer';
import { MarkdownMaterialViewer } from './MarkdownMaterialViewer';

type LearningMaterialViewerProps = {
  url: string | null;
  format: LearningMaterialFormat | null;
  workspaceId?: string;
  workspaceTitle?: string;
  onNavigate?: (url: string) => void;
};

export function LearningMaterialViewer({
  url,
  format,
  workspaceId,
  workspaceTitle,
  onNavigate,
}: LearningMaterialViewerProps) {
  if (!url || !format) {
    return (
      <section className="lesson-viewer lesson-viewer--empty">
        <div className="lesson-viewer__placeholder">
          <h2>No material selected</h2>
          <p>
            {workspaceTitle
              ? `Pick a reference sheet or learning record for ${workspaceTitle}.`
              : 'Select an item from the Learning material tab.'}
          </p>
        </div>
      </section>
    );
  }

  if (format === 'markdown') {
    return (
      <section className="lesson-viewer">
        <MarkdownMaterialViewer url={url} />
      </section>
    );
  }

  return (
    <LessonViewer
      htmlUrl={url}
      workspaceId={workspaceId}
      workspaceTitle={workspaceTitle}
      onNavigate={onNavigate}
    />
  );
}
