import type {
  ChatTurnAccepted,
  ChatTurnPollResponse,
  StoredMessage,
  Turn,
} from '../types/api';
import { ApiError, api } from './client';
import { API_BASE_URL, USE_MOCK_API } from './config';
import { delay, getMockTurn } from '../fixtures/mockTurn';

export const CHAT_POLL_INTERVAL_MS = 10_000;

type MockPendingTurn = {
  content: string;
  messageIndex: number;
  polls: number;
};

const mockPendingTurns = new Map<string, MockPendingTurn>();

export async function fetchChatHistory(workspaceId: string): Promise<StoredMessage[]> {
  if (USE_MOCK_API) {
    await delay(300);
    return [];
  }

  return api<StoredMessage[]>(`/workspaces/${workspaceId}/messages/`);
}

/** Start a chat turn. Returns immediately with 202 + turn_id; does not wait for the assistant. */
export async function startChatTurn(
  workspaceId: string,
  content: string,
  messageIndex = 0,
): Promise<ChatTurnAccepted> {
  if (USE_MOCK_API) {
    await delay(100);
    const turnId = `mock-turn-${Date.now()}-${messageIndex}`;
    mockPendingTurns.set(turnId, { content, messageIndex, polls: 0 });
    return { turn_id: turnId, status: 'pending' };
  }

  const res = await fetch(`${API_BASE_URL}/workspaces/${workspaceId}/chat/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });

  if (res.status !== 202) {
    const text = await res.text();
    throw new ApiError(text || 'Failed to start chat turn', res.status);
  }

  return res.json() as Promise<ChatTurnAccepted>;
}

/** Poll a chat turn by turn_id. */
export async function fetchChatTurn(
  workspaceId: string,
  turnId: string,
): Promise<ChatTurnPollResponse> {
  if (USE_MOCK_API) {
    await delay(100);
    const pending = mockPendingTurns.get(turnId);
    if (!pending) {
      throw new ApiError('Unknown mock turn', 404);
    }

    pending.polls += 1;
    if (pending.polls === 1) {
      return { turn_id: turnId, status: 'running' };
    }

    const turn = getMockTurn(pending.content, pending.messageIndex);
    mockPendingTurns.delete(turnId);
    return { ...turn, status: 'completed' };
  }

  return api<ChatTurnPollResponse>(`/workspaces/${workspaceId}/chat/${turnId}/`);
}

function isCompletedTurn(data: ChatTurnPollResponse): data is Turn & { status: 'completed' } {
  return data.status === 'completed';
}

/**
 * Poll until the turn is completed or failed.
 * Clears the interval when the signal aborts, or when the turn finishes.
 */
export function waitForChatTurn(
  workspaceId: string,
  turnId: string,
  options: {
    intervalMs?: number;
    signal?: AbortSignal;
  } = {},
): Promise<Turn> {
  const intervalMs = options.intervalMs ?? CHAT_POLL_INTERVAL_MS;

  return new Promise((resolve, reject) => {
    let timer: ReturnType<typeof setInterval> | null = null;
    let inFlight = false;

    const cleanup = () => {
      if (timer !== null) {
        clearInterval(timer);
        timer = null;
      }
      options.signal?.removeEventListener('abort', onAbort);
    };

    const onAbort = () => {
      cleanup();
      reject(new DOMException('Chat poll cancelled', 'AbortError'));
    };

    if (options.signal?.aborted) {
      onAbort();
      return;
    }

    options.signal?.addEventListener('abort', onAbort);

    const poll = async () => {
      if (inFlight || options.signal?.aborted) return;
      inFlight = true;

      try {
        const data = await fetchChatTurn(workspaceId, turnId);

        if (options.signal?.aborted) return;

        if (isCompletedTurn(data)) {
          cleanup();
          resolve({
            turn_id: data.turn_id,
            messages: data.messages,
            artifacts: data.artifacts,
            panel: data.panel,
          });
          return;
        }

        if (data.status === 'failed') {
          cleanup();
          reject(new ChatTurnFailedError(data.error, data.code, data.turn_id));
        }
      } catch (err) {
        if (options.signal?.aborted) return;
        cleanup();
        reject(err);
      } finally {
        inFlight = false;
      }
    };

    void poll();
    timer = setInterval(() => {
      void poll();
    }, intervalMs);
  });
}

export class ChatTurnFailedError extends Error {
  code: string;
  turnId: string;

  constructor(message: string, code: string, turnId: string) {
    super(message);
    this.name = 'ChatTurnFailedError';
    this.code = code;
    this.turnId = turnId;
  }
}
