import { useCallback, useEffect, useState } from 'react';
import type { Message, Turn } from '../types/api';
import { fetchChatHistory, sendChatMessage } from '../api/chat';

export function useChat(workspaceId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [lastTurn, setLastTurn] = useState<Turn | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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
    };
  }, [workspaceId]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!workspaceId || !content.trim() || isLoadingHistory) return;

      const trimmed = content.trim();
      const userMessage: Message = {
        role: 'user',
        type: 'text',
        content: trimmed,
      };

      const userMessageCount = messages.filter((m) => m.role === 'user').length;

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);
      setError(null);

      try {
        const turn = await sendChatMessage(workspaceId, trimmed, userMessageCount);
        setLastTurn(turn);
        setMessages((prev) => [...prev, ...turn.messages]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to send message');
      } finally {
        setIsLoading(false);
      }
    },
    [workspaceId, messages, isLoadingHistory],
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
