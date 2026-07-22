import type { WorkspaceManifest, WorkspaceManifestFile } from '../types/api';
import { workspaceVirtualUrl } from '../utils/lessonUrls';

export const WORKSPACE_CACHE_NAME = 'workspace-files-v4';

type LocalFileMeta = {
  etag: string;
  contentType?: string;
};

type LocalWorkspaceMeta = {
  workspace_version: string;
  files: Record<string, LocalFileMeta>;
};

function metaRequestUrl(workspaceId: string): string {
  return `${window.location.origin}/__workspace/${workspaceId}/__meta__.json`;
}

export function virtualRequestUrl(workspaceId: string, filePath: string): string {
  return `${window.location.origin}${workspaceVirtualUrl(workspaceId, filePath)}`;
}

async function openCache(): Promise<Cache> {
  // Cache Storage only exists in secure contexts (HTTPS or localhost).
  if (typeof caches === 'undefined') {
    const protocol = typeof window !== 'undefined' ? window.location.protocol : 'unknown';
    throw new Error(
      `Browser Cache Storage is unavailable (protocol: ${protocol}). ` +
        'Serve the app over HTTPS — HTTP pages cannot cache workspace files.',
    );
  }
  return caches.open(WORKSPACE_CACHE_NAME);
}

export async function readLocalMeta(workspaceId: string): Promise<LocalWorkspaceMeta> {
  const cache = await openCache();
  const res = await cache.match(metaRequestUrl(workspaceId));
  if (!res) {
    return { workspace_version: '', files: {} };
  }
  try {
    return (await res.json()) as LocalWorkspaceMeta;
  } catch {
    return { workspace_version: '', files: {} };
  }
}

export async function writeLocalMeta(
  workspaceId: string,
  manifest: WorkspaceManifest,
): Promise<void> {
  const cache = await openCache();
  const files: Record<string, LocalFileMeta> = {};
  for (const file of manifest.files) {
    files[file.path] = {
      etag: file.etag,
      contentType: file.content_type,
    };
  }
  const meta: LocalWorkspaceMeta = {
    workspace_version: manifest.workspace_version,
    files,
  };
  await cache.put(
    metaRequestUrl(workspaceId),
    new Response(JSON.stringify(meta), {
      headers: { 'Content-Type': 'application/json' },
    }),
  );
}

export function diffManifest(
  manifest: WorkspaceManifest,
  local: LocalWorkspaceMeta,
): { toDownload: WorkspaceManifestFile[]; toDelete: string[] } {
  const toDownload: WorkspaceManifestFile[] = [];
  const remotePaths = new Set<string>();

  for (const file of manifest.files) {
    remotePaths.add(file.path);
    const existing = local.files[file.path];
    if (!existing || existing.etag !== file.etag) {
      toDownload.push(file);
    }
  }

  const toDelete = Object.keys(local.files).filter((path) => !remotePaths.has(path));
  return { toDownload, toDelete };
}

export async function putCachedFile(
  workspaceId: string,
  filePath: string,
  body: Blob,
  contentType: string,
): Promise<void> {
  if (body.size === 0) {
    throw new Error(`Refusing to cache empty file: ${filePath}`);
  }

  const cache = await openCache();
  const headers = new Headers({
    'Content-Type': contentType || 'application/octet-stream',
    'Content-Length': String(body.size),
    'Cache-Control': 'no-cache',
  });
  // Store under a stable absolute URL string so SW fetch matching is reliable.
  const request = new Request(virtualRequestUrl(workspaceId, filePath), { method: 'GET' });
  await cache.put(request, new Response(body, { status: 200, headers }));
}

export async function deleteCachedFile(workspaceId: string, filePath: string): Promise<void> {
  const cache = await openCache();
  await cache.delete(virtualRequestUrl(workspaceId, filePath));
}

export async function readCachedFileText(workspaceId: string, filePath: string): Promise<string> {
  const cache = await openCache();
  const res = await cache.match(virtualRequestUrl(workspaceId, filePath));
  if (!res) {
    throw new Error(`Cached file not found: ${filePath}`);
  }
  return res.text();
}

export async function hasCachedFile(workspaceId: string, filePath: string): Promise<boolean> {
  const cache = await openCache();
  const res = await cache.match(virtualRequestUrl(workspaceId, filePath));
  return Boolean(res);
}
