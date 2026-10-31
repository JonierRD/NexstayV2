import { describe, it } from 'vitest';

// Responsable: Jonier
// Objetivo: jerarquia de roles y acceso a rutas (fuente de verdad del frontend).
//   import { Role, hasRole } from '@/routes/roles';
//   import { findRoute, getAllowedRoutes, isRouteAllowed } from '@/routes/routeAccess';
//   import { moduleRoutes } from '@/routes/moduleRoutes';

describe('U7 - routes/roles.ts y routes/routeAccess.ts', () => {
  it.todo('hasRole respeta ADMIN >= RECEPTION >= CLEANING');
  it.todo('isRouteAllowed permite siempre las rutas publicas');
  it.todo('isRouteAllowed permite rutas sin roles a cualquier autenticado');
  it.todo('isRouteAllowed exige al menos un rol requerido');
  it.todo('findRoute devuelve la ruta por key y undefined si no existe');
  it.todo('getAllowedRoutes filtra el catalogo segun el rol');
  it.todo('el catalogo no tiene keys duplicadas');
});
