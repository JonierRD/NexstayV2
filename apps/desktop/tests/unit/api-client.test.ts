import { describe, it } from 'vitest';

// Responsable: Harold
// Objetivo: capa base de fetch, token y errores.
//   import { apiRequest, ApiError, getStoredToken, setStoredToken } from '@/lib/api/client';
//   import { installSapayBridge, jsonResponse, stubFetch } from '../helpers/mocks';

describe('U4 - lib/api/client.ts', () => {
  it.todo('apiRequest agrega Content-Type y Authorization cuando auth = true');
  it.todo('apiRequest no agrega Authorization cuando auth = false');
  it.todo('apiRequest serializa el body como JSON');
  it.todo('apiRequest devuelve JSON cuando la respuesta es application/json');
  it.todo('apiRequest devuelve texto cuando la respuesta no es JSON');
  it.todo('apiRequest lanza ApiError con status y message del backend');
  it.todo('apiRequest usa el mensaje generico cuando el error no trae message');
  it.todo('setStoredToken/getStoredToken guardan y limpian el token en localStorage');
});
