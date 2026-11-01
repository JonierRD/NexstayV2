import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ApiError,
  apiRequest,
  getStoredToken,
  setStoredToken
} from '@/lib/api/client';
import { installSapayBridge, jsonResponse, stubFetch, textResponse } from '../helpers/mocks';

describe('U4 - lib/api/client.ts', () => {
  beforeEach(() => {
    installSapayBridge();
    setStoredToken(null);
  });

  it('apiRequest agrega Content-Type y Authorization cuando auth = true', async () => {
    setStoredToken('token-123');
    const fetchMock = stubFetch(() => jsonResponse({ ok: true }));

    await apiRequest('/private');

    const request = fetchMock.mock.calls[0][1] as RequestInit;
    expect(request.headers).toEqual({
      'Content-Type': 'application/json',
      Authorization: 'Bearer token-123'
    });
  });

  it('apiRequest no agrega Authorization cuando auth = false', async () => {
    setStoredToken('token-123');
    const fetchMock = stubFetch(() => jsonResponse({ ok: true }));

    await apiRequest('/auth/login', { auth: false });

    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      headers: { 'Content-Type': 'application/json' }
    });
    expect((fetchMock.mock.calls[0][1] as RequestInit).headers).not.toHaveProperty(
      'Authorization'
    );
  });

  it('apiRequest serializa el body como JSON', async () => {
    const fetchMock = stubFetch(() => jsonResponse({ ok: true }));

    await apiRequest('/settings', {
      method: 'PUT',
      body: { hotelName: 'NexStay' }
    });

    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      method: 'PUT',
      body: JSON.stringify({ hotelName: 'NexStay' })
    });
  });

  it('apiRequest devuelve JSON cuando la respuesta es application/json', async () => {
    stubFetch(() => jsonResponse({ name: 'NexStay' }));

    await expect(
      apiRequest<{ name: string }>('/settings', { auth: false })
    ).resolves.toEqual({ name: 'NexStay' });
  });

  it('apiRequest devuelve texto cuando la respuesta no es JSON', async () => {
    stubFetch(() => textResponse('respuesta plana'));

    await expect(apiRequest('/health', { auth: false })).resolves.toBe('respuesta plana');
  });

  it('apiRequest lanza ApiError con status y message del backend', async () => {
    stubFetch(() => jsonResponse({ message: 'No autorizado' }, { status: 401 }));

    await expect(apiRequest('/private')).rejects.toMatchObject({
      name: 'ApiError',
      status: 401,
      message: 'No autorizado'
    });
  });

  it('apiRequest usa el mensaje generico cuando el error no trae message', async () => {
    stubFetch(() => jsonResponse({ error: 'fallo' }, { status: 500 }));

    await expect(apiRequest('/private')).rejects.toEqual(
      new ApiError(500, 'Error 500')
    );
  });

  it('setStoredToken/getStoredToken guardan y limpian el token en localStorage', () => {
    setStoredToken('token-123');
    expect(getStoredToken()).toBe('token-123');

    setStoredToken(null);

    expect(getStoredToken()).toBeNull();
  });
});
