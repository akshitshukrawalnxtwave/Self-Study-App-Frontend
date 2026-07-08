import { useCallback, useEffect, useState } from 'react';
import type { Workspace } from '../types/api';
import { fetchWorkspace } from '../api/workspaces';

export function useWorkspace(workspaceId: string | undefined) {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!workspaceId) {
      setWorkspace(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchWorkspace(workspaceId);
      setWorkspace(data);
    } catch (err) {
      setWorkspace(null);
      setError(err instanceof Error ? err.message : 'Workspace not found');
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { workspace, isLoading, error, reload: load };
}
