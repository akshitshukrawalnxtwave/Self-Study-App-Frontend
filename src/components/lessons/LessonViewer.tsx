import { useEffect, useRef, useState } from 'react';
import {
  isExternalHttpUrl,
  isExternalLessonUrl,
  isVirtualWorkspaceUrl,
  normalizeLessonUrl,
  parseWorkspaceFileUrl,
  quizJsUrlFromLesson,
  resolveWorkspaceNavUrl,
} from '../../utils/lessonUrls';
import { hasCachedFile, readCachedFileText } from '../../services/workspaceCache';
import { rewriteWorkspaceHtmlForLocalCache } from '../../services/rewriteWorkspaceHtml';

type LessonViewerProps = {
  htmlUrl: string | null;
  workspaceId?: string;
  workspaceTitle?: string;
  onNavigate?: (url: string) => void;
  /** True while manifest/presign/download is still running. */
  isSyncing?: boolean;
  /** Bumps after each successful sync so the iframe remounts onto fresh cache. */
  syncGeneration?: number;
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

    // In-workspace pages stay in the lesson pane.
    const navUrl = resolveWorkspaceNavUrl(href, baseUrl, workspaceId);
    if (navUrl) {
      event.preventDefault();
      onNavigate(navUrl);
      return;
    }

    // External http(s) links open in a new browser tab.
    if (isExternalHttpUrl(href, baseUrl)) {
      event.preventDefault();
      try {
        const absolute = new URL(href, baseUrl).href;
        window.open(absolute, '_blank', 'noopener,noreferrer');
      } catch {
        // Ignore malformed hrefs.
      }
    }
  };

  doc.addEventListener('click', handleClick, true);
  return () => doc.removeEventListener('click', handleClick, true);
}

export function LessonViewer({
  htmlUrl,
  workspaceId,
  workspaceTitle,
  onNavigate,
  isSyncing = false,
  syncGeneration = 0,
}: LessonViewerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [readyUrl, setReadyUrl] = useState<string | null>(null);
  const [srcDoc, setSrcDoc] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const resolvedUrl = htmlUrl
    ? workspaceId
      ? normalizeLessonUrl(htmlUrl, workspaceId)
      : normalizeLessonUrl(htmlUrl)
    : null;

  useEffect(() => {
    let cancelled = false;

    async function loadLesson() {
      setLoadError(null);
      setSrcDoc(null);

      if (!resolvedUrl) {
        setReadyUrl(null);
        return;
      }

      if (isSyncing) {
        setReadyUrl(null);
        return;
      }

      if (!isVirtualWorkspaceUrl(resolvedUrl)) {
        setReadyUrl(resolvedUrl);
        return;
      }

      setReadyUrl(null);

      const parsed = parseWorkspaceFileUrl(resolvedUrl);
      if (!parsed) {
        setLoadError('Invalid lesson URL');
        return;
      }

      const cached = await hasCachedFile(parsed.workspaceId, parsed.filePath);
      if (!cached) {
        return;
      }

      try {
        const rawHtml = await readCachedFileText(parsed.workspaceId, parsed.filePath);
        const rewritten = rewriteWorkspaceHtmlForLocalCache(
          rawHtml,
          parsed.workspaceId,
          parsed.filePath,
        );

        if (!cancelled) {
          setSrcDoc(rewritten);
          setReadyUrl(resolvedUrl);
        }
      } catch (err) {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : 'Failed to load lesson');
        }
      }
    }

    void loadLesson();
    return () => {
      cancelled = true;
    };
  }, [resolvedUrl, isSyncing, syncGeneration]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !readyUrl || readyUrl !== resolvedUrl) return;

    const handleLoad = () => {
      if (isVirtualWorkspaceUrl(readyUrl)) {
        try {
          injectQuizScript(iframe, readyUrl);
        } catch {
          // quiz.js should be linked in rewritten HTML.
        }
      }

      if (!workspaceId || !onNavigate || !isVirtualWorkspaceUrl(readyUrl)) {
        return;
      }

      try {
        return interceptWorkspaceLinks(iframe, readyUrl, workspaceId, onNavigate);
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
  }, [resolvedUrl, readyUrl, workspaceId, onNavigate, syncGeneration, srcDoc]);

  if (!resolvedUrl) {
    return (
      <section className="lesson-viewer lesson-viewer--empty">
        <div className="lesson-viewer__placeholder">
          <h2>No lesson yet</h2>
          <p>
            {workspaceTitle
              ? `Keep chatting about ${workspaceTitle} — your first lesson will appear here when ready.`
              : 'Select a workspace and start chatting. Lessons appear here when the Self Study AI Assistant creates them.'}
          </p>
        </div>
      </section>
    );
  }

  if (loadError) {
    return (
      <section className="lesson-viewer lesson-viewer--empty">
        <div className="lesson-viewer__placeholder">
          <h2>Could not load lesson</h2>
          <p>{loadError}</p>
        </div>
      </section>
    );
  }

  if (readyUrl !== resolvedUrl || !srcDoc) {
    return (
      <section className="lesson-viewer lesson-viewer--empty">
        <div className="lesson-viewer__placeholder">
          <h2>Loading lesson…</h2>
          <p>
            {isSyncing
              ? 'Downloading files from storage, then opening the local copy.'
              : 'Preparing lesson HTML and assets…'}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="lesson-viewer">
      <iframe
        ref={iframeRef}
        key={`${readyUrl}:${syncGeneration}`}
        className="lesson-viewer__iframe"
        srcDoc={srcDoc}
        title="Lesson"
        sandbox="allow-scripts allow-same-origin allow-popups"
      />
      {isExternalLessonUrl(readyUrl) && (
        <p className="lesson-viewer__hint">
          Linked pages may not load until files are synced to local /__workspace/… paths.
        </p>
      )}
    </section>
  );
}
