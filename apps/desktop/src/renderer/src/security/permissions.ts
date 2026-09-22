import { Role, hasRole } from '../routes/roles';
import { moduleRoutes } from '../routes/moduleRoutes';
import type { ModuleKey } from '../routes/types';

export type Action = 'view' | 'create' | 'edit' | 'delete' | 'export' | 'manage' | string;
export type Subject = string;

export interface RolePermissions {
  all?: boolean;
  modules?: ModuleKey[];
  actions?: Record<Subject, Action[] | boolean>;
}

/**
 * [Capa 5] Matriz de permisos declarativa por rol.
 * Adaptación de la matriz use-permissions.ts (JHipster) a NexstayV2.
 * - ADMIN cuenta con bypass total (all: true).
 * - RECEPTION tiene granularidad sobre módulos operativos y restricciones de borrado/auditoría/configuración.
 */
export const PERMISSIONS: Record<Role, RolePermissions> = {
  [Role.ADMIN]: {
    all: true
  },
  [Role.RECEPTION]: {
    modules: [
      'dashboard',
      'recepcion',
      'reservas',
      'huespedes',
      'habitaciones',
      'clientes',
      'ventas',
      'parqueadero',
      'lavanderia',
      'inventario',
      'perfil',
      'lavado',
      'ingresos-gastos',
      'semanario',
      'aires',
      'mecato',
      'facturas'
    ],
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
 * Evalúa tanto la matriz de permisos como el catálogo de rutas de Capa 1.
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
  const route = moduleRoutes.find((r) => r.key === moduleKey);
  if (route) {
    if (route.meta.isPublic) {
      return true;
    }
    if (route.meta.roles && route.meta.roles.length > 0) {
      return route.meta.roles.some((requiredRole) => hasRole(role, requiredRole));
    }
  }

  // 3. Verificar contra la lista declarada en la matriz
  const roleModules = PERMISSIONS[role]?.modules;
  if (roleModules && roleModules.includes(moduleKey as ModuleKey)) {
    return true;
  }

  return false;
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
