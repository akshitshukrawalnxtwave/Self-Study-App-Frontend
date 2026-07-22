import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { LearningMaterialSummary, LessonSummary, Turn } from '../types/api';
import {
  FORBIDDEN_WORKSPACE_MESSAGE,
  isForbiddenError,
  messageFromApiError,
} from '../api/client';
import { syncWorkspaceFiles } from '../services/workspaceSync';
import { normalizeLessonUrl, pathFromLessonUrl, titleFromLessonUrl } from '../utils/lessonUrls';

/**
 * Keeps local Cache Storage in sync with the workspace manifest.
 * Selection UI lives in useLessonPanel / useLearningMaterials.
 */
export function useWorkspaceFiles(workspaceId: string | null, lastTurn: Turn | null) {
  const [lessons, setLessons] = useState<LessonSummary[]>([]);
  const [materials, setMaterials] = useState<LearningMaterialSummary[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncGeneration, setSyncGeneration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isForbidden, setIsForbidden] = useState(false);
  const processedTurnRef = useRef<string | null>(null);
  const lessonsRef = useRef(lessons);
  lessonsRef.current = lessons;

  const sync = useCallback(async () => {
    if (!workspaceId) {
      return null;
    }

    setIsSyncing(true);
    setError(null);
    setIsForbidden(false);
    try {
      const result = await syncWorkspaceFiles(workspaceId);
      setLessons(result.lessons);
      setMaterials(result.materials);
      setSyncGeneration((n) => n + 1);
      return result;
    } catch (err) {
      if (isForbiddenError(err)) {
        setIsForbidden(true);
        setError(FORBIDDEN_WORKSPACE_MESSAGE);
      } else {
        setError(messageFromApiError(err, 'Failed to sync workspace files'));
      }
      throw err;
    } finally {
      setIsSyncing(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    if (!workspaceId) {
      setLessons([]);
      setMaterials([]);
      setError(null);
      setIsForbidden(false);
      processedTurnRef.current = null;
      return;
    }

    processedTurnRef.current = null;
    void sync().catch(() => {
      // Error already stored in state.
    });
  }, [workspaceId, sync]);

  // Mark syncing before paint so the iframe does not request /__workspace/… yet.
  useLayoutEffect(() => {
    if (!workspaceId || !lastTurn) {
      return;
    }
    if (processedTurnRef.current === lastTurn.turn_id) {
      return;
    }
    setIsSyncing(true);
  }, [workspaceId, lastTurn]);

  // Re-sync after every completed turn (add / update / delete).
  useEffect(() => {
    if (!workspaceId || !lastTurn) {
      return;
    }
    if (processedTurnRef.current === lastTurn.turn_id) {
      return;
    }
    processedTurnRef.current = lastTurn.turn_id;

    void sync().catch(() => {
      // Error already stored in state.
    });
  }, [workspaceId, lastTurn, sync]);

  // Optimistic lesson row while sync is in flight.
  useEffect(() => {
    if (!workspaceId || !lastTurn) {
      return;
    }

    const lessonArtifact = lastTurn.artifacts.find((artifact) => artifact.type === 'lesson');
    const raw = lastTurn.panel?.html_url ?? lessonArtifact?.url ?? lessonArtifact?.path;
    if (!raw) {
      return;
    }

    const path = pathFromLessonUrl(raw, workspaceId) ?? lessonArtifact?.path;
    if (!path) {
      return;
    }

    const url = normalizeLessonUrl(path, workspaceId);
    if (lessonsRef.current.some((lesson) => lesson.url === url)) {
      return;
    }

    setLessons((current) => [
      ...current,
      {
        path,
        url,
        title: titleFromLessonUrl(lessonArtifact?.path ?? path),
      },
    ]);
  }, [workspaceId, lastTurn]);

  return {
    lessons,
    materials,
    isSyncing,
    syncGeneration,
    error,
    isForbidden,
    sync,
  };
}
