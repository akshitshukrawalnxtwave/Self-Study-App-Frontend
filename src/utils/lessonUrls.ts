/** Virtual same-origin URLs for cached workspace files: /__workspace/{id}/{path} */

export const WORKSPACE_VIRTUAL_PREFIX = '/__workspace';

export function resolveLessonUrl(url: string): string {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return url.startsWith('/') ? url : `/${url}`;
}

export function isExternalLessonUrl(url: string): boolean {
  const resolved = resolveLessonUrl(url);
  return resolved.startsWith('http://') || resolved.startsWith('https://');
}

export function isVirtualWorkspaceUrl(url: string): boolean {
  return url.startsWith(`${WORKSPACE_VIRTUAL_PREFIX}/`);
}

/** Extract workspace id + relative file path from a virtual, proxy, or S3-style URL. */
export function parseWorkspaceFileUrl(
  url: string,
): { workspaceId: string; filePath: string } | null {
  try {
    const parsed = new URL(url, window.location.origin);
    const decoded = decodeURIComponent(parsed.pathname);

    const virtualMatch = decoded.match(/^\/__workspace\/([^/]+)\/(.+)$/);
    if (virtualMatch?.[1] && virtualMatch[2]) {
      return { workspaceId: virtualMatch[1], filePath: virtualMatch[2] };
    }

    const proxyMatch = decoded.match(/\/workspaces\/([^/]+)\/(.+)$/);
    if (proxyMatch?.[1] && proxyMatch[2]) {
      return { workspaceId: proxyMatch[1], filePath: proxyMatch[2] };
    }

    return null;
  } catch {
    return null;
  }
}

/** Build the virtual URL used by the iframe after files are cached locally. */
export function workspaceVirtualUrl(workspaceId: string, filePath: string): string {
  const cleaned = filePath.replace(/^\/+/, '');
  return `${WORKSPACE_VIRTUAL_PREFIX}/${workspaceId}/${cleaned}`;
}

/**
 * Normalize any path, proxy URL, virtual URL, or S3-style URL to a virtual
 * `/__workspace/{id}/{path}` URL for local navigation.
 */
export function normalizeLessonUrl(url: string, workspaceId?: string): string {
  if (!url) {
    return url;
  }

  if (isVirtualWorkspaceUrl(url)) {
    const parsed = parseWorkspaceFileUrl(url);
    if (!parsed) {
      return url.split('?')[0] ?? url;
    }
    if (workspaceId && parsed.workspaceId !== workspaceId) {
      return workspaceVirtualUrl(workspaceId, parsed.filePath);
    }
    return workspaceVirtualUrl(parsed.workspaceId, parsed.filePath);
  }

  const parsed = parseWorkspaceFileUrl(url);
  if (parsed) {
    const id = workspaceId ?? parsed.workspaceId;
    return workspaceVirtualUrl(id, parsed.filePath);
  }

  // Bare relative path: lessons/0001-….html
  if (workspaceId && !url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('/')) {
    return workspaceVirtualUrl(workspaceId, url);
  }

  if (workspaceId && url.startsWith('/') && !url.startsWith('/__workspace/') && !url.startsWith('/workspaces/')) {
    return workspaceVirtualUrl(workspaceId, url.replace(/^\/+/, ''));
  }

  return resolveLessonUrl(url);
}

/** @deprecated Prefer isVirtualWorkspaceUrl — kept for callers during migration. */
export function isProxyWorkspaceUrl(url: string): boolean {
  return isVirtualWorkspaceUrl(url) || url.startsWith('/workspaces/');
}

export function filenameFromLessonUrl(url: string): string {
  try {
    const parsed = new URL(resolveLessonUrl(url), window.location.origin);
    return parsed.pathname.split('/').pop()?.split('?')[0] ?? url;
  } catch {
    return url.split('?')[0].split('/').pop() ?? url;
  }
}

export function titleFromLessonUrl(url: string): string {
  const filename = filenameFromLessonUrl(url);
  return filename.replace(/\.(html|md)$/i, '').replace(/^\d+-/, '').replace(/-/g, ' ');
}

export function formatFromMaterialPath(path: string): 'html' | 'markdown' {
  return path.toLowerCase().endsWith('.md') ? 'markdown' : 'html';
}

export function pathFromLessonUrl(url: string, workspaceId?: string): string | null {
  const normalized = workspaceId ? normalizeLessonUrl(url, workspaceId) : normalizeLessonUrl(url);
  const parsed = parseWorkspaceFileUrl(normalized);
  return parsed?.filePath ?? null;
}

/** True when two lesson/material URLs point at the same workspace file. */
export function sameWorkspaceFileUrl(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) {
    return false;
  }
  if (a === b) {
    return true;
  }

  const pathA = pathFromLessonUrl(a) ?? a.split('?')[0];
  const pathB = pathFromLessonUrl(b) ?? b.split('?')[0];
  return Boolean(pathA && pathB && pathA === pathB);
}

export function quizJsUrlFromLesson(lessonUrl: string): string {
  const info = parseWorkspaceFileUrl(lessonUrl);
  if (info) {
    return workspaceVirtualUrl(info.workspaceId, 'assets/quiz.js');
  }

  const resolved = resolveLessonUrl(lessonUrl);
  const parsed = new URL(resolved, window.location.origin);
  const rootPath = parsed.pathname.replace(/\/(?:lessons|reference)\/[^/]+$/, '');
  return `${parsed.origin}${rootPath}/assets/quiz.js`;
}

/** Resolve in-workspace link clicks to a virtual URL for iframe navigation. */
export function resolveWorkspaceNavUrl(
  href: string,
  baseUrl: string,
  workspaceId: string,
): string | null {
  if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('javascript:')) {
    return null;
  }

  try {
    const base = new URL(baseUrl, window.location.origin);
    const target = new URL(href, base);

    // External absolute URLs stay outside the lesson viewer.
    if (target.origin !== window.location.origin) {
      return null;
    }

    const normalized = normalizeLessonUrl(target.href, workspaceId);
    return isVirtualWorkspaceUrl(normalized) ? normalized : null;
  } catch {
    return null;
  }
}

/** True for http(s) links that leave the app origin. */
export function isExternalHttpUrl(href: string, baseUrl?: string): boolean {
  if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('javascript:')) {
    return false;
  }
  try {
    const target = new URL(href, baseUrl ?? window.location.origin);
    return (
      (target.protocol === 'http:' || target.protocol === 'https:') &&
      target.origin !== window.location.origin
    );
  } catch {
    return false;
  }
}

export function kindFromMaterialPath(path: string): 'reference' | 'learning_record' | 'resource' {
  if (path.startsWith('reference/')) {
    return 'reference';
  }
  if (path.startsWith('learning-records/')) {
    return 'learning_record';
  }
  return 'resource';
}

export function isLessonPath(path: string): boolean {
  return path.startsWith('lessons/') && /\.html?$/i.test(path);
}

export function isMaterialPath(path: string): boolean {
  return (
    path.startsWith('reference/') ||
    path.startsWith('learning-records/') ||
    path.startsWith('resources/')
  );
}
