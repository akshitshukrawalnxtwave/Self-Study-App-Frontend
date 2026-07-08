import { useCallback, useEffect, useState } from 'react';
import type { CreateSessionInput, ChatSession } from '../types/api';
import { createSession, fetchSessions } from '../api/sessions';

export function useSessions() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchSessions();
      setSessions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sessions');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const addSession = useCallback(async (input: CreateSessionInput) => {
    const session = await createSession(input);
    setSessions((prev) => [session, ...prev]);
    return session;
  }, []);

  return {
    sessions,
    isLoading,
    error,
    reload: load,
    addSession,
  };
}
