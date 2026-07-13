import { useCallback, useEffect, useState } from 'react';
import type { LearningMaterialSummary } from '../types/api';
import { fetchWorkspaceLearningMaterials } from '../api/workspaces';
import { normalizeLessonUrl } from '../utils/lessonUrls';

function normalizeMaterials(
  items: LearningMaterialSummary[],
  workspaceId: string,
): LearningMaterialSummary[] {
  return items.map((item) => ({
    ...item,
    url: normalizeLessonUrl(item.url, workspaceId),
  }));
}

export function useLearningMaterials(workspaceId: string | null) {
  const [materials, setMaterials] = useState<LearningMaterialSummary[]>([]);
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadMaterials = useCallback(async () => {
    if (!workspaceId) {
      return [];
    }

    setIsLoading(true);
    try {
      const items = await fetchWorkspaceLearningMaterials(workspaceId);
      const normalized = normalizeMaterials(items, workspaceId);
      setMaterials(normalized);
      return normalized;
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    if (!workspaceId) {
      setMaterials([]);
      setSelectedUrl(null);
      return;
    }

    void loadMaterials();
  }, [workspaceId, loadMaterials]);

  useEffect(() => {
    if (!selectedUrl && materials.length > 0) {
      setSelectedUrl(materials[0].url);
    }
  }, [materials, selectedUrl]);

  const selectMaterial = useCallback(
    (url: string) => {
      setSelectedUrl(workspaceId ? normalizeLessonUrl(url, workspaceId) : normalizeLessonUrl(url));
    },
    [workspaceId],
  );

  const selectedMaterial =
    materials.find((material) => material.url === selectedUrl) ?? null;

  return {
    materials,
    selectedUrl,
    selectedMaterial,
    isLoading,
    selectMaterial,
    reloadMaterials: loadMaterials,
  };
}
