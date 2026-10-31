import { describe, it } from 'vitest';

// Responsable: Harold
// Objetivo: interceptor global de fetch para 401/403.
//   import { applyAuthInterceptors } from '@/lib/api/interceptors';
//   import { authEvents } from '@/lib/api/authEvents';
//   import { resetAuthInterceptors, jsonResponse, stubFetch } from '../helpers/mocks';
//
// OJO: hay un bug conocido aqui. `isPublicAuthPath` recibe la URL absoluta y
// nunca usa `toPathname`, asi que un login fallido (401 en /auth/login) dispara
// "sesion expirada". Escribe el test que lo demuestre y luego corrige el codigo
// en un commit aparte (avisando a Jonier).

describe('U5 - lib/api/interceptors.ts', () => {
  it.todo('adjunta el token guardado a las peticiones');
  it.todo('no sobrescribe un Authorization ya presente');
  it.todo('un 401 en /auth/login NO emite unauthorized ni borra el token');
  it.todo('un 401 en una ruta privada emite unauthorized y borra el token');
  it.todo('un 403 emite forbidden con el motivo');
  it.todo('aplicar el interceptor dos veces no lo envuelve dos veces');
});
