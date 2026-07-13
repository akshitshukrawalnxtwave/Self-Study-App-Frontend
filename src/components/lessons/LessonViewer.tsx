import { useEffect, useRef } from 'react';
import { isExternalLessonUrl, quizJsUrlFromLesson, resolveLessonUrl } from '../../utils/lessonUrls';

type LessonViewerProps = {
  htmlUrl: string | null;
  workspaceTitle?: string;
};

function injectQuizScript(iframe: HTMLIFrameElement, lessonUrl: string): void {
  const doc = iframe.contentDocument;
  if (!doc) return;

  if (!doc.querySelector('.quiz')) return;
  if (doc.querySelector('script[src*="quiz.js"]')) return;

  const script = doc.createElement('script');
  script.src = quizJsUrlFromLesson(lessonUrl);
  doc.body.appendChild(script);
}

export function LessonViewer({ htmlUrl, workspaceTitle }: LessonViewerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const resolvedUrl = htmlUrl ? resolveLessonUrl(htmlUrl) : null;

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !resolvedUrl || isExternalLessonUrl(resolvedUrl)) return;

    const handleLoad = () => {
      try {
        injectQuizScript(iframe, resolvedUrl);
      } catch {
        // S3 / cross-origin lessons must include quiz.js in the HTML from the backend.
      }
    };

    iframe.addEventListener('load', handleLoad);
    return () => iframe.removeEventListener('load', handleLoad);
  }, [resolvedUrl]);

  if (!resolvedUrl) {
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
        ref={iframeRef}
        key={resolvedUrl}
        className="lesson-viewer__iframe"
        src={resolvedUrl}
        title="Lesson"
        sandbox="allow-scripts allow-same-origin"
      />
    </section>
  );
}
