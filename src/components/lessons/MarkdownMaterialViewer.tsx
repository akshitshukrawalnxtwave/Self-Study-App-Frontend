import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { parseWorkspaceFileUrl } from '../../utils/lessonUrls';
import { readCachedFileText } from '../../services/workspaceCache';

type MarkdownMaterialViewerProps = {
  url: string;
};

export function MarkdownMaterialViewer({ url }: MarkdownMaterialViewerProps) {
  const [content, setContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    async function load() {
      try {
        const parsed = parseWorkspaceFileUrl(url);
        let text: string;

        if (parsed) {
          // Prefer Cache Storage so markdown works even before SW controls the page.
          text = await readCachedFileText(parsed.workspaceId, parsed.filePath);
        } else {
          const res = await fetch(url);
          if (!res.ok) {
            throw new Error(`Failed to load file (${res.status})`);
          }
          text = await res.text();
        }

        if (!cancelled) {
          setContent(text);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load material');
          setContent(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [url]);

  if (isLoading) {
    return <p className="learning-material-viewer__status">Loading…</p>;
  }

  if (error) {
    return <p className="learning-material-viewer__status learning-material-viewer__status--error">{error}</p>;
  }

  return (
    <article className="learning-material-viewer learning-material-viewer--markdown">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content ?? ''}</ReactMarkdown>
    </article>
  );
}
