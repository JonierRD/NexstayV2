import { authEvents, type AuthEventDetail } from './authEvents';
import { getStoredToken, setStoredToken } from './client';

function dispatchAuthEvent(event: 'unauthorized' | 'forbidden', detail: AuthEventDetail): void {
  authEvents.emit(event, detail);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(`sapay:auth:${event}`, {
        detail
      })
    );
    window.dispatchEvent(
      new CustomEvent(`auth:${event}`, {
        detail
      })
    );
  }
}

export function applyAuthInterceptors(): void {
  if ((globalThis as typeof globalThis & { __sapayAuthInterceptorsApplied?: boolean }).__sapayAuthInterceptorsApplied) {
    return;
  }

  const originalFetch = globalThis.fetch.bind(globalThis);

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const request =
      typeof input === 'string'
        ? new Request(input, init)
        : input instanceof Request
          ? new Request(input, init)
          : new Request(input, init);

    const token = getStoredToken();
    if (token && !request.headers.has('Authorization')) {
      request.headers.set('Authorization', `Bearer ${token}`);
    }

    const path =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;

    const response = await originalFetch(request);

    if (response.status === 401) {
      setStoredToken(null);
      dispatchAuthEvent('unauthorized', {
        reason: 'Tu sesión expiró. Inicia sesión nuevamente.',
        status: 401,
        path
      });
    }

    if (response.status === 403) {
      dispatchAuthEvent('forbidden', {
        reason: 'No tienes permisos para realizar esta acción.',
        status: 403,
        path
      });
    }

    return response;
  }) as typeof fetch;

  (globalThis as typeof globalThis & { __sapayAuthInterceptorsApplied?: boolean }).__sapayAuthInterceptorsApplied = true;
}
