import { useCallback, useEffect, useRef, useState } from 'react';
import type { Message, Turn } from '../types/api';
import {
  ChatTurnFailedError,
  fetchChatHistory,
  startChatTurn,
  waitForChatTurn,
} from '../api/chat';
import {
  FORBIDDEN_WORKSPACE_MESSAGE,
  isForbiddenError,
  messageFromApiError,
} from '../api/client';

export function useChat(workspaceId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [lastTurn, setLastTurn] = useState<Turn | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isForbidden, setIsForbidden] = useState(false);

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
    setStatusMessage(null);

    if (!workspaceId) {
      setMessages([]);
      setLastTurn(null);
      setError(null);
      setIsForbidden(false);
      return;
    }

    let cancelled = false;

    async function loadHistory() {
      setIsLoadingHistory(true);
      setError(null);
      setIsForbidden(false);
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
          if (isForbiddenError(err)) {
            setIsForbidden(true);
            setError(FORBIDDEN_WORKSPACE_MESSAGE);
          } else {
            setError(messageFromApiError(err, 'Failed to load chat history'));
          }
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
    async (content: string, currentLessonPath?: string) => {
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
      setStatusMessage('Working on your request…');
      setError(null);
      setIsForbidden(false);

      try {
        const accepted = await startChatTurn(
          workspaceId,
          trimmed,
          userMessageCount,
          currentLessonPath,
        );

        if (abortController.signal.aborted) return;

        setStatusMessage(accepted.status_message?.trim() || 'Working on your request…');

        const turn = await waitForChatTurn(workspaceId, accepted.turn_id, {
          signal: abortController.signal,
          onStatusMessage: (message) => {
            if (!abortController.signal.aborted) {
              setStatusMessage(message);
            }
          },
        });

        if (abortController.signal.aborted) return;

        setLastTurn(turn);
        setMessages((prev) => [...prev, ...turn.messages]);
      } catch (err) {
        if (abortController.signal.aborted) return;

        if (isForbiddenError(err)) {
          setIsForbidden(true);
          setError(FORBIDDEN_WORKSPACE_MESSAGE);
        } else if (err instanceof ChatTurnFailedError) {
          setError(err.message);
        } else {
          setError(messageFromApiError(err, 'Failed to send message'));
        }
      } finally {
        if (pollAbortRef.current === abortController) {
          pollAbortRef.current = null;
        }
        if (!abortController.signal.aborted) {
          setIsLoading(false);
          setStatusMessage(null);
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
    statusMessage,
    error,
    isForbidden,
    sendMessage,
  };
}
