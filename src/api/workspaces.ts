import type {
  CreateWorkspaceInput,
  LearningMaterialListItem,
  LearningMaterialSummary,
  LessonListItem,
  LessonSummary,
  Workspace,
} from '../types/api';
import {
  formatFromMaterialPath,
  normalizeLessonUrl,
  pathFromLessonUrl,
  resolveLessonUrl,
  titleFromLessonUrl,
} from '../utils/lessonUrls';
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

/** @deprecated Prefer workspace manifest sync. Kept for legacy callers. */
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
  const path =
    lesson.path ??
    (lesson.url ? pathFromLessonUrl(lesson.url, workspaceId) : null) ??
    (lesson.html_url ? pathFromLessonUrl(lesson.html_url, workspaceId) : null);

  if (!path) {
    return null;
  }

  return {
    id: lesson.id,
    path,
    url: normalizeLessonUrl(path, workspaceId),
    title: lesson.title ?? titleFromLessonUrl(path),
  };
}

/** @deprecated Prefer workspace manifest sync. */
export async function fetchWorkspaceLessons(workspaceId: string): Promise<LessonSummary[]> {
  if (USE_MOCK_API) {
    await delay(200);
    if (workspaceId === 'demo') {
      return [
        {
          path: 'lessons/0001-demo-lesson.html',
          url: normalizeLessonUrl('lessons/0001-demo-lesson.html', workspaceId),
          title: 'Demo lesson',
        },
        {
          path: 'lessons/0002-pressure-depth.html',
          url: normalizeLessonUrl('lessons/0002-pressure-depth.html', workspaceId),
          title: 'Pressure and depth',
        },
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

function resolveLearningMaterialSummary(
  workspaceId: string,
  item: LearningMaterialListItem,
): LearningMaterialSummary | null {
  const path =
    item.path ?? (item.url ? pathFromLessonUrl(item.url, workspaceId) : null) ?? '';
  if (!path) {
    return null;
  }

  const url = normalizeLessonUrl(path, workspaceId);
  const format = item.format ?? formatFromMaterialPath(path);

  return {
    id: item.id,
    kind: item.kind,
    url,
    path,
    title: item.title ?? titleFromLessonUrl(path),
    format,
  };
}

/** @deprecated Prefer workspace manifest sync. */
export async function fetchWorkspaceLearningMaterials(
  workspaceId: string,
): Promise<LearningMaterialSummary[]> {
  if (USE_MOCK_API) {
    await delay(200);
    if (workspaceId === 'demo') {
      return [
        {
          kind: 'reference',
          path: 'reference/hydrostatics-cheatsheet.html',
          url: normalizeLessonUrl('reference/hydrostatics-cheatsheet.html', workspaceId),
          title: 'Hydrostatics cheatsheet',
          format: 'html',
        },
        {
          kind: 'learning_record',
          path: 'learning-records/0001-fluid-mechanics-started.md',
          url: normalizeLessonUrl(
            'learning-records/0001-fluid-mechanics-started.md',
            workspaceId,
          ),
          title: 'Fluid mechanics started',
          format: 'markdown',
        },
      ];
    }
    return [];
  }

  const data = await api<LearningMaterialListItem[]>(`/workspaces/${workspaceId}/materials/`);
  return data
    .map((item) => resolveLearningMaterialSummary(workspaceId, item))
    .filter((item): item is LearningMaterialSummary => item !== null);
}
