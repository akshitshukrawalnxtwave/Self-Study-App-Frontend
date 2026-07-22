import { workspaceVirtualUrl } from '../utils/lessonUrls';

/**
 * Map any proxy / S3 / relative workspace asset reference to a local virtual URL.
 * Returns null if the value is not a workspace file reference.
 */
export function toLocalWorkspaceAssetUrl(
  rawUrl: string,
  workspaceId: string,
): string | null {
  const value = rawUrl.trim();
  if (!value || value.startsWith('#') || value.startsWith('mailto:') || value.startsWith('javascript:')) {
    return null;
  }

  // Already local.
  if (value.startsWith(`/__workspace/${workspaceId}/`)) {
    return value.split('?')[0] ?? value;
  }

  // Django proxy path.
  const proxyPrefix = `/workspaces/${workspaceId}/`;
  if (value.startsWith(proxyPrefix)) {
    const path = value.slice(proxyPrefix.length).split('?')[0] ?? '';
    return path ? workspaceVirtualUrl(workspaceId, path) : null;
  }

  // Absolute S3 / CDN URL containing /workspaces/{id}/...
  const workspacesMatch = value.match(
    new RegExp(`(?:https?:)?//[^"'\\s]+?/workspaces/${workspaceId}/([^"'\\s?#]+)`, 'i'),
  );
  if (workspacesMatch?.[1]) {
    return workspaceVirtualUrl(workspaceId, decodeURIComponent(workspacesMatch[1]));
  }

  // Absolute S3 URL shaped like .../{workspaceId}/assets/lesson.css
  const idPrefixMatch = value.match(
    new RegExp(`(?:https?:)?//[^"'\\s]+?/${workspaceId}/([^"'\\s?#]+)`, 'i'),
  );
  if (idPrefixMatch?.[1] && /\.(css|js|mjs|png|jpe?g|gif|svg|webp|html?|md)$/i.test(idPrefixMatch[1])) {
    return workspaceVirtualUrl(workspaceId, decodeURIComponent(idPrefixMatch[1]));
  }

  // Any presigned S3 URL for shared lesson assets.
  if (/(?:lesson\.css|quiz\.js)(?:\?|$)/i.test(value)) {
    const filename = /quiz\.js/i.test(value) ? 'quiz.js' : 'lesson.css';
    return workspaceVirtualUrl(workspaceId, `assets/${filename}`);
  }

  // Shared asset filenames (relative or root).
  if (/^(?:\.\/)?(?:\.\.\/)?(?:assets\/)?(?:lesson\.css|quiz\.js)$/i.test(value)) {
    const filename = value.split('/').pop();
    return filename ? workspaceVirtualUrl(workspaceId, `assets/${filename}`) : null;
  }
  if (/^\/(?:lesson\.css|quiz\.js)$/i.test(value)) {
    return workspaceVirtualUrl(workspaceId, `assets${value}`);
  }
  if (value.startsWith('/assets/')) {
    return workspaceVirtualUrl(workspaceId, value.slice(1));
  }

  return null;
}

/**
 * Rewrite lesson HTML so asset URLs hit the local virtual workspace
 * (`/__workspace/...`) instead of Django proxy or raw S3 URLs.
 */
export function rewriteWorkspaceHtmlForLocalCache(
  html: string,
  workspaceId: string,
  filePath?: string,
): string {
  let out = html;
  void filePath;

  // <base href="https://s3.../workspaces/id/..."> makes relative CSS/JS hit S3.
  out = out.replace(/<base\b[^>]*>/gi, (tag) => {
    if (/href\s*=\s*["'][^"']*s3[^"']*/i.test(tag) || /\/workspaces\//i.test(tag) || /href\s*=\s*["']https?:/i.test(tag)) {
      return '';
    }
    return tag;
  });

  // Absolute proxy paths for this workspace.
  out = out.replaceAll(`/workspaces/${workspaceId}/`, `/__workspace/${workspaceId}/`);

  // Any workspace UUID proxy path.
  out = out.replace(/\/workspaces\/([0-9a-fA-F-]{8,})\//g, '/__workspace/$1/');

  // Full S3/CDN URLs → local virtual paths (drop query/signature).
  out = out.replace(
    /(href|src)=(["'])(https?:\/\/[^"']+?\/workspaces\/[^"']+)\2/gi,
    (_match, attr: string, quote: string, url: string) => {
      const local = toLocalWorkspaceAssetUrl(url, workspaceId);
      return local ? `${attr}=${quote}${local}${quote}` : _match;
    },
  );

  out = out.replace(
    /(href|src)=(["'])(https?:\/\/[^"']+?\/(?:[^"']*?\/)?assets\/(?:lesson\.css|quiz\.js)(?:\?[^"']*)?)\2/gi,
    (_match, attr: string, quote: string, url: string) => {
      const local = toLocalWorkspaceAssetUrl(url, workspaceId);
      return local ? `${attr}=${quote}${local}${quote}` : _match;
    },
  );

  // Root-relative assets that omit the workspace prefix.
  out = out.replace(
    /(href|src)=(["'])\/assets\//gi,
    `$1=$2/__workspace/${workspaceId}/assets/`,
  );

  // Common shared asset names next to the lesson file.
  out = out.replace(
    /(href|src)=["'](?:\.\/)?(?:\.\.\/)?(?:assets\/)?(lesson\.css|quiz\.js)["']/gi,
    (_match, attr: string, filename: string) =>
      `${attr}="/__workspace/${workspaceId}/assets/${filename}"`,
  );

  out = out.replace(
    /(href|src)=["']\/(lesson\.css|quiz\.js)["']/gi,
    (_match, attr: string, filename: string) =>
      `${attr}="/__workspace/${workspaceId}/assets/${filename}"`,
  );

  if (filePath) {
    out = ensureVirtualBaseTag(out, workspaceId, filePath);
  }

  out = markExternalLinksOpenInNewTab(out);
  return out;
}

/** Add target=_blank to absolute http(s) links that leave the app. */
export function markExternalLinksOpenInNewTab(html: string): string {
  return html.replace(/<a\b([^>]*?)>/gi, (tag, attrs: string) => {
    const hrefMatch = attrs.match(/\bhref\s*=\s*(["'])(.*?)\1/i);
    if (!hrefMatch) {
      return tag;
    }

    const href = hrefMatch[2];
    if (!/^https?:\/\//i.test(href)) {
      return tag;
    }

    // Keep same-origin /__workspace and /workspaces links in the viewer.
    try {
      const url = new URL(href);
      if (url.origin === window.location.origin) {
        return tag;
      }
    } catch {
      return tag;
    }

    let nextAttrs = attrs;
    if (/\btarget\s*=/i.test(nextAttrs)) {
      nextAttrs = nextAttrs.replace(/\btarget\s*=\s*(["']).*?\1/i, 'target="_blank"');
    } else {
      nextAttrs += ' target="_blank"';
    }

    if (/\brel\s*=/i.test(nextAttrs)) {
      nextAttrs = nextAttrs.replace(/\brel\s*=\s*(["'])(.*?)\1/i, (_m, q: string, rel: string) => {
        const parts = new Set(rel.split(/\s+/).filter(Boolean));
        parts.add('noopener');
        parts.add('noreferrer');
        return `rel=${q}${[...parts].join(' ')}${q}`;
      });
    } else {
      nextAttrs += ' rel="noopener noreferrer"';
    }

    return `<a${nextAttrs}>`;
  });
}

/** Base URL so relative lesson links resolve under /__workspace/{id}/lessons/… */
export function ensureVirtualBaseTag(
  html: string,
  workspaceId: string,
  filePath: string,
): string {
  const dir = filePath.includes('/') ? filePath.replace(/\/[^/]+$/, '/') : '';
  const baseHref = `${window.location.origin}${workspaceVirtualUrl(workspaceId, dir)}`;

  if (/<base\b/i.test(html)) {
    return html.replace(/<base\b[^>]*>/gi, `<base href="${baseHref}">`);
  }

  if (/<head\b[^>]*>/i.test(html)) {
    return html.replace(/<head\b[^>]*>/i, (head) => `${head}\n  <base href="${baseHref}">`);
  }

  return `<head><base href="${baseHref}"></head>\n${html}`;
}

/** Fix link/script/img URLs already in a loaded iframe document. */
export function rewriteDocumentAssetUrls(doc: Document, workspaceId: string): void {
  // Remove S3/proxy <base> so relative URLs resolve against /__workspace/...
  doc.querySelectorAll('base[href]').forEach((base) => {
    const href = base.getAttribute('href') ?? '';
    if (/s3[.-]/i.test(href) || href.includes('/workspaces/') || href.startsWith('http')) {
      base.remove();
    }
  });

  const attrs = ['href', 'src'] as const;
  const nodes = doc.querySelectorAll('link[href], script[src], img[src], source[src], a[href]');

  nodes.forEach((node) => {
    for (const attr of attrs) {
      const value = node.getAttribute(attr);
      if (!value) continue;

      const local = toLocalWorkspaceAssetUrl(value, workspaceId);
      if (local && local !== value) {
        node.setAttribute(attr, local);
      }
    }
  });
}
