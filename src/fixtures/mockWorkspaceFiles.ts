/** Inline fixture bodies used when VITE_USE_MOCK_API=true (no real S3). */

export type MockWorkspaceFile = {
  etag: string;
  contentType: string;
  body: string;
};

export const MOCK_WORKSPACE_FILES: Record<string, MockWorkspaceFile> = {
  'lessons/0001-demo-lesson.html': {
    etag: 'mock-lesson-1',
    contentType: 'text/html; charset=utf-8',
    body: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Demo lesson</title>
  <link rel="stylesheet" href="../assets/lesson.css" />
</head>
<body>
  <h1>Hydrostatic pressure</h1>
  <p>Pressure in a fluid increases with depth: <code>p = ρgh</code>.</p>
  <p><a href="0002-pressure-depth.html">Next: Pressure and depth</a></p>
  <div class="quiz" data-question="Does pressure increase with depth?" data-answer="yes"></div>
  <script src="../assets/quiz.js"></script>
</body>
</html>`,
  },
  'lessons/0002-pressure-depth.html': {
    etag: 'mock-lesson-2',
    contentType: 'text/html; charset=utf-8',
    body: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Pressure and depth</title>
  <link rel="stylesheet" href="../assets/lesson.css" />
</head>
<body>
  <h1>Pressure and depth</h1>
  <p>At greater depth, more fluid sits above a point, so pressure rises.</p>
  <p><a href="0001-demo-lesson.html">Back to intro</a></p>
</body>
</html>`,
  },
  'assets/lesson.css': {
    etag: 'mock-css-1',
    contentType: 'text/css; charset=utf-8',
    body: `body { font-family: Georgia, serif; max-width: 40rem; margin: 2rem auto; padding: 0 1rem; line-height: 1.5; }
h1 { font-size: 1.75rem; }
code { background: #f3f3f3; padding: 0.1em 0.3em; }
.quiz { margin-top: 1.5rem; padding: 1rem; border: 1px solid #ccc; }`,
  },
  'assets/quiz.js': {
    etag: 'mock-quiz-1',
    contentType: 'application/javascript; charset=utf-8',
    body: `document.querySelectorAll('.quiz').forEach((el) => {
  if (el.dataset.bound) return;
  el.dataset.bound = '1';
  const q = el.getAttribute('data-question') || 'Quiz';
  const btn = document.createElement('button');
  btn.textContent = 'Reveal hint';
  btn.addEventListener('click', () => {
    btn.textContent = el.getAttribute('data-answer') || 'Think about depth.';
  });
  el.appendChild(document.createElement('p')).textContent = q;
  el.appendChild(btn);
});`,
  },
  'reference/hydrostatics-cheatsheet.html': {
    etag: 'mock-ref-1',
    contentType: 'text/html; charset=utf-8',
    body: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Hydrostatics cheatsheet</title>
  <link rel="stylesheet" href="../assets/lesson.css" />
</head>
<body>
  <h1>Hydrostatics cheatsheet</h1>
  <ul>
    <li><code>p = ρgh</code></li>
    <li>Pascal's principle</li>
  </ul>
</body>
</html>`,
  },
  'learning-records/0001-fluid-mechanics-started.md': {
    etag: 'mock-md-1',
    contentType: 'text/markdown; charset=utf-8',
    body: `# Fluid mechanics started

- Covered hydrostatic pressure intro
- Next: pressure vs depth examples
`,
  },
};

export function mockManifestFor(workspaceId: string) {
  void workspaceId;
  return {
    workspace_version: 'mock-1',
    files: Object.entries(MOCK_WORKSPACE_FILES).map(([path, file]) => ({
      path,
      etag: file.etag,
      content_type: file.contentType,
      size: file.body.length,
    })),
  };
}
