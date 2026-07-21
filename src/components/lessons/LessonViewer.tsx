import { useEffect, useRef } from 'react';
import {
  isExternalLessonUrl,
  isProxyWorkspaceUrl,
  normalizeLessonUrl,
  quizJsUrlFromLesson,
  resolveWorkspaceNavUrl,
} from '../../utils/lessonUrls';

type LessonViewerProps = {
  htmlUrl: string | null;
  workspaceId?: string;
  workspaceTitle?: string;
  onNavigate?: (url: string) => void;
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

function interceptWorkspaceLinks(
  iframe: HTMLIFrameElement,
  baseUrl: string,
  workspaceId: string,
  onNavigate: (url: string) => void,
): () => void {
  const doc = iframe.contentDocument;
  if (!doc) {
    return () => {};
  }

  const handleClick = (event: MouseEvent) => {
    const anchor = (event.target as Element | null)?.closest?.('a');
    if (!anchor) return;

    const href = anchor.getAttribute('href');
    if (!href) return;

    const navUrl = resolveWorkspaceNavUrl(href, baseUrl, workspaceId);
    if (!navUrl) return;

    event.preventDefault();
    onNavigate(navUrl);
  };

  doc.addEventListener('click', handleClick, true);
  return () => doc.removeEventListener('click', handleClick, true);
}

export function LessonViewer({
  htmlUrl,
  workspaceId,
  workspaceTitle,
  onNavigate,
}: LessonViewerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const resolvedUrl = htmlUrl
    ? workspaceId
      ? normalizeLessonUrl(htmlUrl, workspaceId)
      : normalizeLessonUrl(htmlUrl)
    : null;

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !resolvedUrl) return;

    const handleLoad = () => {
      if (isProxyWorkspaceUrl(resolvedUrl)) {
        try {
          injectQuizScript(iframe, resolvedUrl);
        } catch {
          // Cross-origin fallback — quiz.js must be linked in HTML.
        }
      }

      if (!workspaceId || !onNavigate || !isProxyWorkspaceUrl(resolvedUrl)) {
        return;
      }

      try {
        return interceptWorkspaceLinks(iframe, resolvedUrl, workspaceId, onNavigate);
      } catch {
        return undefined;
      }
    };

    let removeLinks: (() => void) | undefined;

    const onIframeLoad = () => {
      removeLinks?.();
      removeLinks = handleLoad();
    };

    iframe.addEventListener('load', onIframeLoad);
    return () => {
      iframe.removeEventListener('load', onIframeLoad);
      removeLinks?.();
    };
  }, [resolvedUrl, workspaceId, onNavigate]);

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
      {isExternalLessonUrl(resolvedUrl) && (
        <p className="lesson-viewer__hint">
          Linked pages may not load until lesson URLs use /workspaces/… paths from the server.
        </p>
      )}
    </section>
  );
}
