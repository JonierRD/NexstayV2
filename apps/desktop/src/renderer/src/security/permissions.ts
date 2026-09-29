import { Role } from '../routes/roles';
import { findRoute, isRouteAllowed } from '../routes/routeAccess';
import type { ModuleKey } from '../routes/types';

export type Action = 'view' | 'create' | 'edit' | 'delete' | 'export' | 'manage' | string;
export type Subject = string;

export interface RolePermissions {
  all?: boolean;
  actions?: Record<Subject, Action[] | boolean>;
}

/**
 * [Capa 5] Matriz de permisos declarativa por rol.
 * La lista de módulos accesibles NO se declara aquí: se resuelve contra el catálogo
 * centralizado de moduleRoutes (Capa 1) mediante isRouteAllowed.
 * - ADMIN cuenta con bypass total (all: true).
 * - RECEPTION tiene granularidad sobre módulos operativos y restricciones de borrado/auditoría/configuración.
 */
export const PERMISSIONS: Record<Role, RolePermissions> = {
  [Role.ADMIN]: {
    all: true
  },
  [Role.RECEPTION]: {
    actions: {
      recepcion: ['view', 'create', 'edit'],
      clientes: ['view', 'create', 'edit'],
      huespedes: ['view', 'create', 'edit'],
      habitaciones: ['view', 'edit'],
      ventas: ['view', 'create'],
      lavanderia: ['view', 'create', 'edit'],
      inventario: ['view', 'create', 'edit'],
      perfil: ['view', 'edit']
      // auditoría y config NO están permitidos para recepción
    }
  }
};

/**
 * Comprueba si un rol tiene permiso para acceder a un módulo de la aplicación.
 * Delega la decisión de acceso al catálogo de rutas de Capa 1.
 */
export function canAccessModule(role: Role | null | undefined, moduleKey: ModuleKey | string): boolean {
  if (!role) {
    return false;
  }

  // 1. Bypass para roles con all: true (ADMIN)
  if (PERMISSIONS[role]?.all) {
    return true;
  }

  // 2. Verificar contra el catálogo centralizado de moduleRoutes (Capa 1)
  const route = findRoute(moduleKey);
  if (!route) {
    return false;
  }

  return isRouteAllowed(role, route);
}

/**
 * Comprueba si un rol tiene permiso para ejecutar una acción sobre un sujeto/recurso.
 * Equivalente a usePermissions.can(action, subject) del modelo base.
 */
export function can(role: Role | null | undefined, action: Action, subject: Subject): boolean {
  if (!role) {
    return false;
  }

  // 1. Bypass total para ADMIN
  if (PERMISSIONS[role]?.all) {
    return true;
  }

  // 2. Si la acción es 'view', comprobar si tiene acceso al módulo correspondiente
  if (action === 'view' && canAccessModule(role, subject)) {
    return true;
  }

  // 3. Comprobar acciones específicas en la matriz
  const subjectPerms = PERMISSIONS[role]?.actions?.[subject];
  if (subjectPerms === true) {
    return true;
  }

  if (Array.isArray(subjectPerms)) {
    return subjectPerms.includes(action) || subjectPerms.includes('manage');
  }

  return false;
}
