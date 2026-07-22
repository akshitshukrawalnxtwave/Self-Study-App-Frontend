import { useCallback, useEffect, useRef, useState } from 'react';
import type { LessonSummary, Turn } from '../types/api';
import { normalizeLessonUrl } from '../utils/lessonUrls';

type UseLessonPanelArgs = {
  workspaceId: string | null;
  lastTurn: Turn | null;
  lessons: LessonSummary[];
  isSyncing: boolean;
};

/**
 * Lesson selection on top of shared workspace file sync.
 * Panel URL from a turn is applied once per turn; user clicks always win after that.
 */
export function useLessonPanel({
  workspaceId,
  lastTurn,
  lessons,
  isSyncing,
}: UseLessonPanelArgs) {
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
  const appliedTurnRef = useRef<string | null>(null);
  const userPickedRef = useRef(false);

  useEffect(() => {
    if (!workspaceId) {
      setSelectedUrl(null);
      appliedTurnRef.current = null;
      userPickedRef.current = false;
    }
  }, [workspaceId]);

  // Apply panel URL once per completed turn, and only after that turn's sync finishes.
  useEffect(() => {
    if (!workspaceId || !lastTurn || isSyncing) {
      return;
    }
    if (appliedTurnRef.current === lastTurn.turn_id) {
      return;
    }

    const panelUrl = lastTurn.panel?.html_url ?? null;
    if (panelUrl) {
      appliedTurnRef.current = lastTurn.turn_id;
      userPickedRef.current = false;
      setSelectedUrl(normalizeLessonUrl(panelUrl, workspaceId));
    }
  }, [lastTurn, workspaceId, isSyncing]);

  // Initial fallback when opening a workspace with existing lessons.
  useEffect(() => {
    if (isSyncing || selectedUrl || lessons.length === 0 || userPickedRef.current) {
      return;
    }
    if (lastTurn?.panel?.html_url) {
      return;
    }
    setSelectedUrl(lessons[lessons.length - 1].url);
  }, [lessons, selectedUrl, isSyncing, lastTurn]);

  const selectLesson = useCallback(
    (url: string) => {
      userPickedRef.current = true;
      setSelectedUrl(workspaceId ? normalizeLessonUrl(url, workspaceId) : normalizeLessonUrl(url));
    },
    [workspaceId],
  );

  return {
    htmlUrl: selectedUrl,
    lessons,
    isLoading: isSyncing,
    selectLesson,
  };
}
