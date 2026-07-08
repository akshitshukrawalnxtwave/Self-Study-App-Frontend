import type { StoredMessage, Turn } from '../types/api';
import { api } from './client';
import { USE_MOCK_API } from './config';
import { delay, getMockTurn } from '../fixtures/mockTurn';

export async function fetchChatHistory(workspaceId: string): Promise<StoredMessage[]> {
  if (USE_MOCK_API) {
    await delay(300);
    return [];
  }

  return api<StoredMessage[]>(`/workspaces/${workspaceId}/messages/`);
}

export async function sendChatMessage(
  workspaceId: string,
  content: string,
  messageIndex: number,
): Promise<Turn> {
  if (USE_MOCK_API) {
    await delay(800);
    return getMockTurn(content, messageIndex);
  }

  return api<Turn>(`/workspaces/${workspaceId}/chat/`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
}
