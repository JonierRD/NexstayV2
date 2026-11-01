import { beforeEach, describe, expect, it, vi } from 'vitest';
import { applyAuthInterceptors } from '@/lib/api/interceptors';
import { authEvents } from '@/lib/api/authEvents';
import { setStoredToken } from '@/lib/api/client';
import {
  jsonResponse,
  resetAuthInterceptors,
  stubFetch
} from '../helpers/mocks';

describe('U5 - lib/api/interceptors.ts', () => {
  beforeEach(() => {
    resetAuthInterceptors();
    setStoredToken('token-123');
  });

  it('adjunta el token guardado a las peticiones', async () => {
    const fetchMock = stubFetch(() => jsonResponse({ ok: true }));
    applyAuthInterceptors();

    await fetch('http://api.test/private');

    expect(fetchMock.mock.calls[0][0]).toBeInstanceOf(Request);
    expect((fetchMock.mock.calls[0][0] as Request).headers.get('Authorization')).toBe(
      'Bearer token-123'
    );
  });

  it('no sobrescribe un Authorization ya presente', async () => {
    const fetchMock = stubFetch(() => jsonResponse({ ok: true }));
    applyAuthInterceptors();

    await fetch('http://api.test/private', { headers: { Authorization: 'Bearer custom' } });

    expect((fetchMock.mock.calls[0][0] as Request).headers.get('Authorization')).toBe(
      'Bearer custom'
    );
  });

  it('un 401 en /auth/login NO emite unauthorized ni borra el token', async () => {
    const emit = vi.spyOn(authEvents, 'emit');
    stubFetch(() => jsonResponse({ message: 'Credenciales invalidas' }, { status: 401 }));
    applyAuthInterceptors();

    await fetch('http://api.test/auth/login');

    expect(emit).not.toHaveBeenCalledWith('unauthorized', expect.anything());
    expect(localStorage.getItem('sapay-token')).toBe('token-123');
  });

  it('un 401 en una ruta privada emite unauthorized y borra el token', async () => {
    const emit = vi.spyOn(authEvents, 'emit');
    stubFetch(() => jsonResponse({ message: 'Expirada' }, { status: 401 }));
    applyAuthInterceptors();

    await fetch('http://api.test/stays');

    expect(localStorage.getItem('sapay-token')).toBeNull();
    expect(emit).toHaveBeenCalledWith(
      'unauthorized',
      expect.objectContaining({ status: 401, path: 'http://api.test/stays' })
    );
  });

  it('un 403 emite forbidden con el motivo', async () => {
    const emit = vi.spyOn(authEvents, 'emit');
    stubFetch(() => jsonResponse({ message: 'Sin permisos' }, { status: 403 }));
    applyAuthInterceptors();

    await fetch('http://api.test/admin');

    expect(emit).toHaveBeenCalledWith(
      'forbidden',
      expect.objectContaining({
        status: 403,
        reason: 'No tienes permisos para realizar esta acción.'
      })
    );
  });

  it('aplicar el interceptor dos veces no lo envuelve dos veces', async () => {
    const fetchMock = stubFetch(() => jsonResponse({ ok: true }));
    applyAuthInterceptors();
    applyAuthInterceptors();

    await fetch('http://api.test/private');

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
