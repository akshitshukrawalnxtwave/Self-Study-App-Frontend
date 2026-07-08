type LessonViewerProps = {
  htmlUrl: string | null;
  workspaceTitle?: string;
};

export function LessonViewer({ htmlUrl, workspaceTitle }: LessonViewerProps) {
  if (!htmlUrl) {
    return (
      <section className="lesson-viewer lesson-viewer--empty">
        <div className="lesson-viewer__placeholder">
          <h2>No lesson yet</h2>
          <p>
            {workspaceTitle
              ? `Keep chatting about ${workspaceTitle} — your first lesson will appear here when ready.`
              : 'Select a workspace and start chatting. Lessons appear here when the teacher creates them.'}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="lesson-viewer">
      <iframe
        className="lesson-viewer__iframe"
        src={htmlUrl}
        title="Lesson"
        sandbox="allow-scripts allow-same-origin"
      />
    </section>
  );
}
