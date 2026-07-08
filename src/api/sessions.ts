import type { ChatSession, CreateSessionInput } from '../types/api';
import { api } from './client';
import { USE_MOCK_API } from './config';
import { MOCK_SESSIONS } from '../fixtures/mockSessions';
import { delay } from '../fixtures/mockTurn';
import { createWorkspace } from './workspaces';

let mockSessions = [...MOCK_SESSIONS];

export async function fetchSessions(): Promise<ChatSession[]> {
  if (USE_MOCK_API) {
    await delay(300);
    return [...mockSessions].sort(
      (a, b) =>
        new Date(b.last_active_at).getTime() - new Date(a.last_active_at).getTime(),
    );
  }

  return api<ChatSession[]>('/sessions/');
}

export async function fetchSession(sessionId: string): Promise<ChatSession> {
  if (USE_MOCK_API) {
    await delay(200);
    const session = mockSessions.find((s) => s.id === sessionId);
    if (!session) {
      throw new Error('Session not found');
    }
    return session;
  }

  return api<ChatSession>(`/sessions/${sessionId}/`);
}

export async function createSession(input: CreateSessionInput): Promise<ChatSession> {
  if (USE_MOCK_API) {
    await delay(500);
    const workspace = await createWorkspace({
      title: input.title,
      topic_slug: input.topic_slug,
    });
    const session: ChatSession = {
      id: `session-${Date.now()}`,
      title: input.title,
      workspace_id: workspace.id,
      topic_slug: input.topic_slug,
      last_active_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };
    mockSessions = [session, ...mockSessions];
    return session;
  }

  return api<ChatSession>('/sessions/', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function touchSession(sessionId: string): Promise<void> {
  if (USE_MOCK_API) {
    mockSessions = mockSessions.map((s) =>
      s.id === sessionId ? { ...s, last_active_at: new Date().toISOString() } : s,
    );
    return;
  }

  await api<void>(`/sessions/${sessionId}/`, { method: 'PATCH' });
}
