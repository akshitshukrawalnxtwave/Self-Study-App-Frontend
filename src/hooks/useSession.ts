import { useCallback, useEffect, useState } from 'react';
import type { ChatSession } from '../types/api';
import { fetchSession } from '../api/sessions';

export function useSession(sessionId: string | undefined) {
  const [session, setSession] = useState<ChatSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!sessionId) {
      setSession(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchSession(sessionId);
      setSession(data);
    } catch (err) {
      setSession(null);
      setError(err instanceof Error ? err.message : 'Session not found');
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { session, isLoading, error, reload: load };
}
