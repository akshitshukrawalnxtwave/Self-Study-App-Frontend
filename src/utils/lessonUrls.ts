/** Lesson iframe src — S3/CDN absolute URL or Django static path (/workspaces/...). */

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
  return filename.replace('.html', '').replace(/^\d+-/, '').replace(/-/g, ' ');
}

/** Django local fallback only — derive quiz.js URL from a /workspaces/... lesson path. */
export function quizJsUrlFromLesson(lessonUrl: string): string {
  const resolved = resolveLessonUrl(lessonUrl);
  const parsed = new URL(resolved, window.location.origin);
  const rootPath = parsed.pathname.replace(/\/lessons\/[^/]+$/, '');
  return `${parsed.origin}${rootPath}/assets/quiz.js`;
}
