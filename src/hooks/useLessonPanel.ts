import { useCallback, useEffect, useState } from 'react';
import type { Turn } from '../types/api';
import { fetchWorkspaceLessons } from '../api/workspaces';

export function useLessonPanel(workspaceId: string | null, lastTurn: Turn | null) {
  const [lessons, setLessons] = useState<string[]>([]);
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!workspaceId) {
      setLessons([]);
      setSelectedUrl(null);
      return;
    }

    let cancelled = false;

    async function load() {
      setIsLoading(true);
      try {
        const urls = await fetchWorkspaceLessons(workspaceId!);
        if (!cancelled) {
          setLessons(urls);
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
  }, [workspaceId]);

  useEffect(() => {
    const panelUrl = lastTurn?.panel?.html_url ?? null;
    if (panelUrl) {
      setSelectedUrl(panelUrl);
    }
  }, [lastTurn]);

  useEffect(() => {
    if (!selectedUrl && lessons.length > 0) {
      setSelectedUrl(lessons[lessons.length - 1]);
    }
  }, [lessons, selectedUrl]);

  const selectLesson = useCallback((url: string) => {
    setSelectedUrl(url);
  }, []);

  return {
    htmlUrl: selectedUrl,
    lessons,
    isLoading,
    selectLesson,
  };
}
