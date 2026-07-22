import { useCallback, useEffect, useState } from 'react';
import type { CreateWorkspaceInput, Workspace } from '../types/api';
import { messageFromApiError } from '../api/client';
import { createWorkspace, fetchWorkspaces } from '../api/workspaces';
import { ensureIdentity } from '../auth/identity';

export function useWorkspaces() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      ensureIdentity();
      const data = await fetchWorkspaces();
      setWorkspaces(data);
    } catch (err) {
      setError(messageFromApiError(err, 'Failed to load workspaces'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const addWorkspace = useCallback(async (input: CreateWorkspaceInput) => {
    const workspace = await createWorkspace(input);
    setWorkspaces((prev) => [workspace, ...prev]);
    return workspace;
  }, []);

  return {
    workspaces,
    isLoading,
    error,
    reload: load,
    addWorkspace,
  };
}
