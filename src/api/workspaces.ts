import type { CreateWorkspaceInput, Workspace } from '../types/api';
import { api } from './client';
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

export async function fetchWorkspaceLessons(workspaceId: string): Promise<string[]> {
  if (USE_MOCK_API) {
    await delay(200);
    if (workspaceId === 'demo') {
      return [
        '/workspaces/demo/lessons/0001-demo-lesson.html',
        '/workspaces/demo/lessons/0002-pressure-depth.html',
      ];
    }
    return [];
  }

  const data = await api<{ url: string }[]>(`/workspaces/${workspaceId}/lessons/`);
  return data.map((lesson) => lesson.url);
}
