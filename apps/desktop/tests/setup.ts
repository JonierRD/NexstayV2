import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Limpieza comun a todas las pruebas. Evita que el estado de una prueba
// (token, cache, fetch mockeado, interceptor aplicado) se filtre a la siguiente.
afterEach(() => {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  delete (
    globalThis as typeof globalThis & { __sapayAuthInterceptorsApplied?: boolean }
  ).__sapayAuthInterceptorsApplied;
  delete window.sapay;
});

// jsdom no implementa scrollIntoView y AssistantChat lo usa al montar.
if (!window.HTMLElement.prototype.scrollIntoView) {
  window.HTMLElement.prototype.scrollIntoView = vi.fn();
}
