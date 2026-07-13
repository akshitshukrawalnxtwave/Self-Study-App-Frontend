/** Fetch raw workspace file bytes (HTML, markdown, etc.) via /workspaces/... proxy. */

export async function fetchWorkspaceFile(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to load file (${res.status})`);
  }
  return res.text();
}
