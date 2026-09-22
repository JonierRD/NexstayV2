import { useMemo } from 'react';
import { Role } from '../routes/roles';
import type { ModuleKey } from '../routes/types';
import type { PublicUser } from '../lib/api';
import { can as canCheck, canAccessModule, type Action, type Subject } from './permissions';
import { useAuthSession } from '../context/AuthContext';

export interface UsePermissionsOptions {
  user?: PublicUser | null;
  role?: Role | null;
}

/**
 * [Capa 5] Hook para consultar permisos en componentes de React.
 * Si no se provee un usuario o rol en las opciones, intenta obtenerlo de useAuthSession().
 */
export function usePermissions(options?: UsePermissionsOptions) {
  let sessionUser: PublicUser | null = null;

  try {
    const session = useAuthSession();
    sessionUser = session.user;
  } catch {
    // Si se utiliza fuera de AuthProvider, continúa con options?.user o options?.role
  }

  const activeUser = options?.user ?? sessionUser;
  const activeRole = options?.role ?? (activeUser?.role as Role | undefined) ?? null;

  return useMemo(() => {
    return {
      role: activeRole,
      user: activeUser,
      isAdmin: activeRole === Role.ADMIN,
      isReception: activeRole === Role.RECEPTION,
      can: (action: Action, subject: Subject): boolean => {
        return canCheck(activeRole, action, subject);
      },
      canAccess: (moduleKey: ModuleKey | string): boolean => {
        return canAccessModule(activeRole, moduleKey);
      }
    };
  }, [activeRole, activeUser]);
}
