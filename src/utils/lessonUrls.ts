/** Lesson iframe URLs — prefer same-origin /workspaces/... proxy paths. */

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

/** Extract workspace id + relative file path from a proxy or S3 URL. */
export function parseWorkspaceFileUrl(url: string): { workspaceId: string; filePath: string } | null {
  try {
    const parsed = new URL(url, window.location.origin);
    const match = decodeURIComponent(parsed.pathname).match(/\/workspaces\/([^/]+)\/(.+)$/);
    if (!match?.[1] || !match[2]) {
      return null;
    }
    return { workspaceId: match[1], filePath: match[2] };
  } catch {
    return null;
  }
}

/** Map S3 or proxy URL to same-origin /workspaces/{id}/{path} (no query string). */
export function toWorkspaceProxyUrl(url: string, workspaceId?: string): string | null {
  const direct = resolveLessonUrl(url);
  if (direct.startsWith('/workspaces/')) {
    const parsed = parseWorkspaceFileUrl(direct);
    if (!parsed) {
      return direct.split('?')[0] ?? direct;
    }
    if (workspaceId && parsed.workspaceId !== workspaceId) {
      return null;
    }
    return `/workspaces/${parsed.workspaceId}/${parsed.filePath}`;
  }

  const parsed = parseWorkspaceFileUrl(url);
  if (!parsed) {
    return null;
  }
  if (workspaceId && parsed.workspaceId !== workspaceId) {
    return null;
  }
  return `/workspaces/${parsed.workspaceId}/${parsed.filePath}`;
}

/** Prefer /workspaces/... proxy path so iframe assets and links stay same-origin. */
export function normalizeLessonUrl(url: string, workspaceId?: string): string {
  return toWorkspaceProxyUrl(url, workspaceId) ?? resolveLessonUrl(url);
}

export function isProxyWorkspaceUrl(url: string): boolean {
  return url.startsWith('/workspaces/');
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

export function quizJsUrlFromLesson(lessonUrl: string): string {
  const info = parseWorkspaceFileUrl(lessonUrl);
  if (info) {
    return `/workspaces/${info.workspaceId}/assets/quiz.js`;
  }

  const resolved = resolveLessonUrl(lessonUrl);
  const parsed = new URL(resolved, window.location.origin);
  const rootPath = parsed.pathname.replace(/\/(?:lessons|reference)\/[^/]+$/, '');
  return `${parsed.origin}${rootPath}/assets/quiz.js`;
}

/** Resolve in-workspace link clicks to a proxy URL for iframe navigation. */
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
    return toWorkspaceProxyUrl(target.href, workspaceId);
  } catch {
    return null;
  }
}
