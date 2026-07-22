import {
  downloadWorkspaceFileBody,
  fetchWorkspaceManifest,
  presignWorkspaceFiles,
} from '../api/workspaceFiles';
import type {
  LearningMaterialSummary,
  LessonSummary,
  WorkspaceManifest,
} from '../types/api';
import {
  formatFromMaterialPath,
  isLessonPath,
  isMaterialPath,
  kindFromMaterialPath,
  titleFromLessonUrl,
  workspaceVirtualUrl,
} from '../utils/lessonUrls';
import {
  deleteCachedFile,
  diffManifest,
  putCachedFile,
  readLocalMeta,
  writeLocalMeta,
} from './workspaceCache';
import { ensureWorkspaceServiceWorker } from './workspaceServiceWorker';
import { rewriteWorkspaceHtmlForLocalCache } from './rewriteWorkspaceHtml';

export type WorkspaceSyncResult = {
  manifest: WorkspaceManifest;
  lessons: LessonSummary[];
  materials: LearningMaterialSummary[];
  downloaded: string[];
  deleted: string[];
};

/** Prefer extension — S3 often returns application/octet-stream, which blocks CSS. */
export function contentTypeFor(path: string, _hinted?: string): string {
  const lower = path.toLowerCase();
  if (lower.endsWith('.html') || lower.endsWith('.htm')) {
    return 'text/html; charset=utf-8';
  }
  if (lower.endsWith('.css')) {
    return 'text/css; charset=utf-8';
  }
  if (lower.endsWith('.js') || lower.endsWith('.mjs')) {
    return 'application/javascript; charset=utf-8';
  }
  if (lower.endsWith('.md')) {
    return 'text/markdown; charset=utf-8';
  }
  if (lower.endsWith('.json')) {
    return 'application/json; charset=utf-8';
  }
  if (lower.endsWith('.svg')) {
    return 'image/svg+xml';
  }
  if (lower.endsWith('.png')) {
    return 'image/png';
  }
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) {
    return 'image/jpeg';
  }
  if (lower.endsWith('.gif')) {
    return 'image/gif';
  }
  if (lower.endsWith('.webp')) {
    return 'image/webp';
  }
  return 'application/octet-stream';
}

export function lessonsFromManifest(
  workspaceId: string,
  manifest: WorkspaceManifest,
): LessonSummary[] {
  return manifest.files
    .filter((file) => isLessonPath(file.path))
    .map((file) => ({
      path: file.path,
      url: workspaceVirtualUrl(workspaceId, file.path),
      title: titleFromLessonUrl(file.path),
    }))
    .sort((a, b) => a.path.localeCompare(b.path));
}

export function materialsFromManifest(
  workspaceId: string,
  manifest: WorkspaceManifest,
): LearningMaterialSummary[] {
  return manifest.files
    .filter((file) => isMaterialPath(file.path))
    .map((file) => ({
      kind: kindFromMaterialPath(file.path),
      path: file.path,
      url: workspaceVirtualUrl(workspaceId, file.path),
      title: titleFromLessonUrl(file.path),
      format: formatFromMaterialPath(file.path),
    }))
    .sort((a, b) => a.path.localeCompare(b.path));
}

async function prepareCachedBody(
  workspaceId: string,
  path: string,
  response: Response,
): Promise<Blob> {
  const contentType = contentTypeFor(path);
  if (path.toLowerCase().endsWith('.html') || path.toLowerCase().endsWith('.htm')) {
    const html = await response.text();
    const rewritten = rewriteWorkspaceHtmlForLocalCache(html, workspaceId, path);
    return new Blob([rewritten], { type: contentType });
  }
  const buffer = await response.arrayBuffer();
  return new Blob([buffer], { type: contentType });
}

/**
 * Sync workspace files: fetch manifest, presign only stale/missing paths,
 * download from S3 into Cache Storage, evict deleted paths.
 */
export async function syncWorkspaceFiles(workspaceId: string): Promise<WorkspaceSyncResult> {
  await ensureWorkspaceServiceWorker();

  const manifest = await fetchWorkspaceManifest(workspaceId);
  const local = await readLocalMeta(workspaceId);
  const { toDownload, toDelete } = diffManifest(manifest, local);

  for (const path of toDelete) {
    await deleteCachedFile(workspaceId, path);
  }

  const downloaded: string[] = [];

  if (toDownload.length > 0) {
    const { urls } = await presignWorkspaceFiles(
      workspaceId,
      toDownload.map((file) => file.path),
    );
    const urlByPath = new Map(urls.map((entry) => [entry.path, entry.url]));

    await Promise.all(
      toDownload.map(async (file) => {
        const downloadUrl = urlByPath.get(file.path);
        if (!downloadUrl) {
          throw new Error(`No presigned URL for ${file.path}`);
        }

        const response = await downloadWorkspaceFileBody(workspaceId, file.path, downloadUrl);
        const contentType = contentTypeFor(file.path);
        const blob = await prepareCachedBody(workspaceId, file.path, response);
        if (blob.size === 0) {
          throw new Error(`Downloaded empty body for ${file.path}`);
        }
        await putCachedFile(workspaceId, file.path, blob, contentType);
        downloaded.push(file.path);
      }),
    );
  }

  await writeLocalMeta(workspaceId, manifest);

  return {
    manifest,
    lessons: lessonsFromManifest(workspaceId, manifest),
    materials: materialsFromManifest(workspaceId, manifest),
    downloaded,
    deleted: toDelete,
  };
}
