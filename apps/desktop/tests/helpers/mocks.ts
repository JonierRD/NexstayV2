import { vi } from 'vitest';

type SapayBridge = NonNullable<Window['sapay']>;

/**
 * Instala el puente IPC que el preload expone en produccion.
 * Necesario para `resolveApiBaseUrl` y para el asistente.
 */
export function installSapayBridge(overrides: Partial<SapayBridge> = {}): SapayBridge {
  const bridge: SapayBridge = {
    getConfig: vi.fn<SapayBridge['getConfig']>(async () => ({ apiUrl: 'http://api.test' })),
    askAssistant: vi.fn<SapayBridge['askAssistant']>(async () => 'Respuesta de prueba'),
    ...overrides
  };
  window.sapay = bridge;
  return bridge;
}

export function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(init.headers ?? {})
    }
  });
}

export function textResponse(body: string, init: ResponseInit = {}): Response {
  return new Response(body, {
    status: 200,
    ...init,
    headers: {
      'content-type': 'text/plain',
      ...(init.headers ?? {})
    }
  });
}

/** Reemplaza fetch global y devuelve el mock para inspeccionar llamadas. */
export function stubFetch(
  handler: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response> | Response
) {
  const fetchMock = vi.fn(handler);
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

/** Limpia la bandera del interceptor para poder reaplicarlo en cada prueba. */
export function resetAuthInterceptors(): void {
  delete (
    globalThis as typeof globalThis & { __sapayAuthInterceptorsApplied?: boolean }
  ).__sapayAuthInterceptorsApplied;
}
