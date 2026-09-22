import { type ReactNode, type ReactElement } from 'react';
import { Role } from '../routes/roles';
import type { ModuleKey } from '../routes/types';
import type { PublicUser } from '../lib/api';
import { usePermissions } from './usePermissions';
import type { Action, Subject } from './permissions';

export interface CanProps {
  /**
   * Acción a comprobar (ej. 'view', 'create', 'delete').
   * Debe usarse en conjunto con la prop `on`.
   */
  perform?: Action;

  /**
   * Recurso o módulo sujeto de la acción (ej. 'clientes', 'auditoria').
   */
  on?: Subject;

  /**
   * Clave del módulo a verificar (ej. 'auditoria', 'config').
   */
  module?: ModuleKey | string;

  /**
   * Rol requerido directamente (ej. Role.ADMIN o [Role.ADMIN]).
   */
  role?: Role | Role[];

  /**
   * Usuario específico sobre el cual evaluar (opcional; por defecto usa la sesión activa).
   */
  user?: PublicUser | null;

  /**
   * Elemento visual a mostrar si el usuario no tiene permisos (opcional; por defecto null).
   */
  fallback?: ReactNode;

  /**
   * Contenido a renderizar condicionalmente si el usuario tiene permiso.
   */
  children: ReactNode;
}

/**
 * [Capa 5] Componente declarativo para ocultamiento condicional en la UI.
 * Equivalente directo a la directiva `v-can="['action', 'subject']"` de Vue / JHipster.
 *
 * Ejemplos de uso:
 *
 * ```tsx
 * // 1. Ocultar por módulo:
 * <Can module="auditoria">
 *   <AuditoriaSection />
 * </Can>
 *
 * // 2. Ocultar por acción y recurso:
 * <Can perform="delete" on="habitaciones" fallback={<DisabledDeleteButton />}>
 *   <DeleteRoomButton onClick={handleDelete} />
 * </Can>
 *
 * // 3. Ocultar por rol explícito:
 * <Can role={Role.ADMIN}>
 *   <AdminOnlyPanel />
 * </Can>
 * ```
 */
export function Can({
  perform,
  on,
  module: targetModule,
  role: targetRole,
  user,
  fallback = null,
  children
}: CanProps): ReactElement | null {
  const permissions = usePermissions({ user });

  // 1. Verificación por módulo
  if (targetModule) {
    if (!permissions.canAccess(targetModule)) {
      return fallback ? <>{fallback}</> : null;
    }
  }

  // 2. Verificación por acción y sujeto
  if (perform && on) {
    if (!permissions.can(perform, on)) {
      return fallback ? <>{fallback}</> : null;
    }
  }

  // 3. Verificación por rol directo
  if (targetRole) {
    const roles = Array.isArray(targetRole) ? targetRole : [targetRole];
    const userRole = permissions.role;

    if (!userRole) {
      return fallback ? <>{fallback}</> : null;
    }

    const hasDirectRole = userRole === Role.ADMIN || roles.includes(userRole);
    if (!hasDirectRole) {
      return fallback ? <>{fallback}</> : null;
    }
  }

  return <>{children}</>;
}
