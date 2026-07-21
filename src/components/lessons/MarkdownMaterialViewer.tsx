import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { fetchWorkspaceFile } from '../../api/workspaceFiles';

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

    void fetchWorkspaceFile(url)
      .then((text) => {
        if (!cancelled) {
          setContent(text);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load material');
          setContent(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

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
