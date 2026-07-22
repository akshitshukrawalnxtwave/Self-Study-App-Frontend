import { useCallback, useEffect, useState } from 'react';
import type { LearningMaterialSummary } from '../types/api';
import { normalizeLessonUrl, sameWorkspaceFileUrl } from '../utils/lessonUrls';

type UseLearningMaterialsArgs = {
  workspaceId: string | null;
  materials: LearningMaterialSummary[];
  isSyncing: boolean;
};

/**
 * Material selection on top of shared workspace file sync.
 * List comes from the manifest (useWorkspaceFiles).
 */
export function useLearningMaterials({
  workspaceId,
  materials,
  isSyncing,
}: UseLearningMaterialsArgs) {
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!workspaceId) {
      setSelectedUrl(null);
    }
  }, [workspaceId]);

  useEffect(() => {
    if (isSyncing) {
      return;
    }
    if (!selectedUrl && materials.length > 0) {
      setSelectedUrl(materials[0].url);
    }
  }, [materials, selectedUrl, isSyncing]);

  const selectMaterial = useCallback(
    (url: string) => {
      setSelectedUrl(workspaceId ? normalizeLessonUrl(url, workspaceId) : normalizeLessonUrl(url));
    },
    [workspaceId],
  );

  const selectedMaterial =
    materials.find((material) => sameWorkspaceFileUrl(material.url, selectedUrl)) ?? null;

  return {
    materials,
    selectedUrl,
    selectedMaterial,
    isLoading: isSyncing,
    selectMaterial,
  };
}
