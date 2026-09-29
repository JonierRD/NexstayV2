// [Capa 1] Única fuente de verdad para decidir si un rol puede acceder a una ruta.
// El RouteGuard (Capa 2) y la matriz de permisos (Capa 5) consultan estas funciones
// en lugar de reimplementar la decisión por su cuenta.

import { hasRole, type Role } from './roles';
import { moduleRoutes } from './moduleRoutes';
import type { AppRoute, ModuleKey } from './types';

/**
 * Indica si un rol tiene acceso a una ruta concreta.
 * - Las rutas públicas siempre se permiten.
 * - Las rutas sin roles declarados se permiten a cualquier usuario autenticado.
 * - En el resto de casos se exige cumplir al menos uno de los roles requeridos.
 */
export function isRouteAllowed(role: Role, route: AppRoute): boolean {
  if (route.meta.isPublic) {
    return true;
  }
  if (!route.meta.roles || route.meta.roles.length === 0) {
    return true;
  }
  return route.meta.roles.some((required) => hasRole(role, required));
}

/** Busca en el catálogo la ruta que corresponde a una clave de módulo. */
export function findRoute(key: ModuleKey | string): AppRoute | undefined {
  return moduleRoutes.find((route) => route.key === key);
}

/** Devuelve todas las rutas del catálogo a las que el rol tiene acceso. */
export function getAllowedRoutes(role: Role): AppRoute[] {
  return moduleRoutes.filter((route) => isRouteAllowed(role, route));
}
