import type { CreateWorkspaceInput, LessonListItem, LessonSummary, Workspace } from '../types/api';
import { resolveLessonUrl } from '../utils/lessonUrls';
import { api, ApiError } from './client';
import { USE_MOCK_API } from './config';
import { MOCK_WORKSPACES } from '../fixtures/mockWorkspaces';
import { delay } from '../fixtures/mockTurn';

let mockWorkspaces = [...MOCK_WORKSPACES];

export async function fetchWorkspaces(): Promise<Workspace[]> {
  if (USE_MOCK_API) {
    await delay(300);
    return [...mockWorkspaces];
  }

  return api<Workspace[]>('/workspaces/');
}

export async function fetchWorkspace(workspaceId: string): Promise<Workspace> {
  if (USE_MOCK_API) {
    await delay(200);
    const workspace = mockWorkspaces.find((w) => w.id === workspaceId);
    if (!workspace) {
      throw new Error('Workspace not found');
    }
    return workspace;
  }

  const workspaces = await fetchWorkspaces();
  const workspace = workspaces.find((w) => w.id === workspaceId);
  if (!workspace) {
    throw new Error('Workspace not found');
  }
  return workspace;
}

export async function createWorkspace(input: CreateWorkspaceInput): Promise<Workspace> {
  if (USE_MOCK_API) {
    await delay(400);
    const workspace: Workspace = {
      id: `ws-${Date.now()}`,
      title: input.title,
      topic_slug: input.topic_slug,
      created_at: new Date().toISOString(),
    };
    mockWorkspaces = [workspace, ...mockWorkspaces];
    return workspace;
  }

  return api<Workspace>('/workspaces/', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

/** GET /api/workspaces/{id}/lessons/{lesson_id}/ → { html_url } (S3 or Django static URL). */
export async function fetchLessonHtmlUrl(
  workspaceId: string,
  lessonId: string,
): Promise<string | null> {
  if (USE_MOCK_API) {
    return null;
  }

  try {
    const detail = await api<{ html_url: string }>(
      `/workspaces/${workspaceId}/lessons/${lessonId}/`,
    );
    return detail.html_url ? resolveLessonUrl(detail.html_url) : null;
  } catch (err) {
    // Lesson in DB but file missing in S3 — skip rather than break the session.
    if (err instanceof ApiError && err.status === 404) {
      return null;
    }
    throw err;
  }
}

async function resolveLessonSummary(
  workspaceId: string,
  lesson: LessonListItem,
): Promise<LessonSummary | null> {
  const directUrl = lesson.url ?? lesson.html_url;
  if (directUrl) {
    return {
      id: lesson.id,
      url: resolveLessonUrl(directUrl),
      title: lesson.title,
    };
  }

  if (lesson.id) {
    const htmlUrl = await fetchLessonHtmlUrl(workspaceId, lesson.id);
    if (htmlUrl) {
      return { id: lesson.id, url: htmlUrl, title: lesson.title };
    }
  }

  return null;
}

export async function fetchWorkspaceLessons(workspaceId: string): Promise<LessonSummary[]> {
  if (USE_MOCK_API) {
    await delay(200);
    if (workspaceId === 'demo') {
      return [
        { url: '/workspaces/demo/lessons/0001-demo-lesson.html', title: 'Demo lesson' },
        { url: '/workspaces/demo/lessons/0002-pressure-depth.html', title: 'Pressure and depth' },
      ];
    }
    return [];
  }

  const data = await api<LessonListItem[]>(`/workspaces/${workspaceId}/lessons/`);
  const resolved = await Promise.all(
    data.map((lesson) => resolveLessonSummary(workspaceId, lesson)),
  );
  return resolved.filter((lesson): lesson is LessonSummary => lesson !== null);
}
