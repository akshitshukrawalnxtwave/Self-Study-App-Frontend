import { useCallback, useEffect, useState } from 'react';
import type { Workspace } from '../types/api';
import {
  FORBIDDEN_WORKSPACE_MESSAGE,
  isForbiddenError,
  messageFromApiError,
} from '../api/client';
import { fetchWorkspace } from '../api/workspaces';

export function useWorkspace(workspaceId: string | undefined) {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isForbidden, setIsForbidden] = useState(false);

  const load = useCallback(async () => {
    if (!workspaceId) {
      setWorkspace(null);
      setIsLoading(false);
      setIsForbidden(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    setIsForbidden(false);
    try {
      const data = await fetchWorkspace(workspaceId);
      setWorkspace(data);
    } catch (err) {
      setWorkspace(null);
      if (isForbiddenError(err)) {
        setIsForbidden(true);
        setError(FORBIDDEN_WORKSPACE_MESSAGE);
      } else {
        setError(messageFromApiError(err, 'Workspace not found'));
      }
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { workspace, isLoading, error, isForbidden, reload: load };
}
