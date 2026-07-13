import { useCallback, useEffect, useRef, useState } from 'react';
import type { LessonSummary, Turn } from '../types/api';
import { fetchWorkspaceLessons } from '../api/workspaces';
import { resolveLessonUrl, titleFromLessonUrl } from '../utils/lessonUrls';

function urlsFromTurn(turn: Turn): string[] {
  const urls: string[] = [];
  const panelUrl = turn.panel?.html_url;
  if (panelUrl) {
    urls.push(resolveLessonUrl(panelUrl));
  }
  for (const artifact of turn.artifacts) {
    if (artifact.type === 'lesson' && artifact.url) {
      urls.push(resolveLessonUrl(artifact.url));
    }
  }
  return urls;
}

function turnHasNewLesson(turn: Turn, knownUrls: Set<string>): boolean {
  return urlsFromTurn(turn).some((url) => !knownUrls.has(url));
}

function lessonFromTurn(turn: Turn): LessonSummary | null {
  const lessonArtifact = turn.artifacts.find((artifact) => artifact.type === 'lesson');
  const rawUrl = turn.panel?.html_url ?? lessonArtifact?.url ?? null;
  if (!rawUrl) {
    return null;
  }
  return {
    url: resolveLessonUrl(rawUrl),
    title: lessonArtifact?.path
      ? titleFromLessonUrl(lessonArtifact.path)
      : titleFromLessonUrl(rawUrl),
  };
}

export function useLessonPanel(workspaceId: string | null, lastTurn: Turn | null) {
  const [lessons, setLessons] = useState<LessonSummary[]>([]);
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const lessonsRef = useRef(lessons);
  const processedTurnRef = useRef<string | null>(null);

  lessonsRef.current = lessons;

  const loadLessons = useCallback(async () => {
    if (!workspaceId) {
      return [];
    }

    setIsLoading(true);
    try {
      const items = await fetchWorkspaceLessons(workspaceId);
      setLessons(items);
      return items;
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    if (!workspaceId) {
      setLessons([]);
      setSelectedUrl(null);
      processedTurnRef.current = null;
      return;
    }

    processedTurnRef.current = null;
    void loadLessons();
  }, [workspaceId, loadLessons]);

  useEffect(() => {
    const panelUrl = lastTurn?.panel?.html_url ?? null;
    if (panelUrl) {
      setSelectedUrl(resolveLessonUrl(panelUrl));
    }
  }, [lastTurn]);

  useEffect(() => {
    if (!selectedUrl && lessons.length > 0) {
      setSelectedUrl(lessons[lessons.length - 1].url);
    }
  }, [lessons, selectedUrl]);

  useEffect(() => {
    if (!workspaceId || !lastTurn) {
      return;
    }

    if (processedTurnRef.current === lastTurn.turn_id) {
      return;
    }
    processedTurnRef.current = lastTurn.turn_id;

    const knownUrls = new Set(lessonsRef.current.map((lesson) => lesson.url));
    if (!turnHasNewLesson(lastTurn, knownUrls)) {
      return;
    }

    const optimisticLesson = lessonFromTurn(lastTurn);
    if (optimisticLesson && !knownUrls.has(optimisticLesson.url)) {
      setLessons((current) => [...current, optimisticLesson]);
    }

    void loadLessons();
  }, [workspaceId, lastTurn, loadLessons]);

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
