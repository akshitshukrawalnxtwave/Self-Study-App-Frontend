import type {
  PresignFilesResponse,
  WorkspaceManifest,
  WorkspaceManifestFile,
} from '../types/api';
import { api } from './client';
import { USE_MOCK_API } from './config';
import { delay } from '../fixtures/mockTurn';
import { MOCK_WORKSPACE_FILES, mockManifestFor } from '../fixtures/mockWorkspaceFiles';

/** GET /api/workspaces/{id}/manifest/ — paths + etags only (no file bodies, no presigned URLs). */
export async function fetchWorkspaceManifest(workspaceId: string): Promise<WorkspaceManifest> {
  if (USE_MOCK_API) {
    await delay(150);
    return mockManifestFor(workspaceId);
  }

  return api<WorkspaceManifest>(`/workspaces/${workspaceId}/manifest/`);
}

/**
 * POST /api/workspaces/{id}/files/presign/
 * Request presigned GET URLs only for paths the client needs to download.
 */
export async function presignWorkspaceFiles(
  workspaceId: string,
  paths: string[],
): Promise<PresignFilesResponse> {
  if (paths.length === 0) {
    return { urls: [] };
  }

  if (USE_MOCK_API) {
    await delay(100);
    return {
      urls: paths.map((path) => ({
        path,
        url: `mock://workspace/${workspaceId}/${path}`,
        expires_in: 3600,
      })),
    };
  }

  return api<PresignFilesResponse>(`/workspaces/${workspaceId}/files/presign/`, {
    method: 'POST',
    body: JSON.stringify({ paths }),
  });
}

/**
 * Download a workspace file body.
 * Mock mode returns fixture content; production fetches the presigned S3 URL.
 */
export async function downloadWorkspaceFileBody(
  _workspaceId: string,
  path: string,
  downloadUrl: string,
): Promise<Response> {
  if (USE_MOCK_API || downloadUrl.startsWith('mock://')) {
    const fixture = MOCK_WORKSPACE_FILES[path];
    if (!fixture) {
      return new Response(`Mock file missing: ${path}`, { status: 404 });
    }
    return new Response(fixture.body, {
      status: 200,
      headers: { 'Content-Type': fixture.contentType },
    });
  }

  const res = await fetch(downloadUrl, { mode: 'cors', credentials: 'omit' });
  if (!res.ok) {
    throw new Error(`Failed to download ${path} (${res.status})`);
  }
  // Opaque / blocked CORS responses can look "successful" with an unreadable empty body.
  if (res.type === 'opaque' || res.type === 'opaqueredirect') {
    throw new Error(
      `Failed to download ${path}: CORS blocked the S3 response (opaque). Fix S3 CORS for this origin.`,
    );
  }
  return res;
}

export type { WorkspaceManifest, WorkspaceManifestFile };
