/** Register the workspace file Service Worker (serves /__workspace/… from Cache Storage). */

let registrationPromise: Promise<ServiceWorkerRegistration | null> | null = null;

export function registerWorkspaceServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return Promise.resolve(null);
  }

  if (!registrationPromise) {
    registrationPromise = navigator.serviceWorker
      .register('/workspace-sw.js', { scope: '/' })
      .then(async (reg) => {
        await navigator.serviceWorker.ready;
        reg.active?.postMessage({ type: 'CLAIM_CLIENTS' });
        return reg;
      })
      .catch((err) => {
        console.warn('Workspace service worker registration failed', err);
        return null;
      });
  }

  return registrationPromise;
}

export async function ensureWorkspaceServiceWorker(): Promise<boolean> {
  const reg = await registerWorkspaceServiceWorker();
  if (!reg) {
    return false;
  }

  if (navigator.serviceWorker.controller) {
    return true;
  }

  reg.active?.postMessage({ type: 'CLAIM_CLIENTS' });

  // First registration: wait briefly for clients.claim() / controllerchange.
  await new Promise<void>((resolve) => {
    const timeout = window.setTimeout(() => resolve(), 2500);
    navigator.serviceWorker.addEventListener(
      'controllerchange',
      () => {
        window.clearTimeout(timeout);
        resolve();
      },
      { once: true },
    );
  });

  return Boolean(navigator.serviceWorker.controller);
}
