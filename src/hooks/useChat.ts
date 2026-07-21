import { useCallback, useEffect, useRef, useState } from 'react';
import type { Message, Turn } from '../types/api';
import {
  ChatTurnFailedError,
  fetchChatHistory,
  startChatTurn,
  waitForChatTurn,
} from '../api/chat';

export function useChat(workspaceId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [lastTurn, setLastTurn] = useState<Turn | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pollAbortRef = useRef<AbortController | null>(null);
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  const cancelActivePoll = useCallback(() => {
    if (pollAbortRef.current) {
      pollAbortRef.current.abort();
      pollAbortRef.current = null;
    }
  }, []);

  useEffect(() => {
    cancelActivePoll();
    setIsLoading(false);

    if (!workspaceId) {
      setMessages([]);
      setLastTurn(null);
      setError(null);
      return;
    }

    let cancelled = false;

    async function loadHistory() {
      setIsLoadingHistory(true);
      setError(null);
      try {
        const history = await fetchChatHistory(workspaceId!);
        if (!cancelled) {
          setMessages(
            history.map((msg) => ({
              role: msg.role,
              type: msg.type,
              content: msg.content,
            })),
          );
          setLastTurn(null);
        }
      } catch (err) {
        if (!cancelled) {
          setMessages([]);
          setError(err instanceof Error ? err.message : 'Failed to load chat history');
        }
      } finally {
        if (!cancelled) {
          setIsLoadingHistory(false);
        }
      }
    }

    void loadHistory();

    return () => {
      cancelled = true;
      cancelActivePoll();
    };
  }, [workspaceId, cancelActivePoll]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!workspaceId || !content.trim() || isLoadingHistory) return;

      const trimmed = content.trim();
      const userMessage: Message = {
        role: 'user',
        type: 'text',
        content: trimmed,
      };

      const userMessageCount = messagesRef.current.filter((m) => m.role === 'user').length;

      // One active poll per workspace — cancel any previous turn.
      cancelActivePoll();
      const abortController = new AbortController();
      pollAbortRef.current = abortController;

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);
      setError(null);

      try {
        const { turn_id } = await startChatTurn(workspaceId, trimmed, userMessageCount);

        if (abortController.signal.aborted) return;

        const turn = await waitForChatTurn(workspaceId, turn_id, {
          signal: abortController.signal,
        });

        if (abortController.signal.aborted) return;

        setLastTurn(turn);
        setMessages((prev) => [...prev, ...turn.messages]);
      } catch (err) {
        if (abortController.signal.aborted) return;

        if (err instanceof ChatTurnFailedError) {
          setError(err.message);
        } else {
          setError(err instanceof Error ? err.message : 'Failed to send message');
        }
      } finally {
        if (pollAbortRef.current === abortController) {
          pollAbortRef.current = null;
        }
        if (!abortController.signal.aborted) {
          setIsLoading(false);
        }
      }
    },
    [workspaceId, isLoadingHistory, cancelActivePoll],
  );

  return {
    messages,
    lastTurn,
    isLoadingHistory,
    isLoading,
    error,
    sendMessage,
  };
}
