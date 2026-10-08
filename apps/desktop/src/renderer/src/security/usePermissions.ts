import { useMemo } from 'react';
import { Role } from '../routes/roles';
import type { ModuleKey } from '../routes/types';
import type { PublicUser } from '../lib/api';
import { canAccessModule } from './permissions';
import { useOptionalAuthSession } from '../context/AuthContext';

export interface UsePermissionsOptions {
  user?: PublicUser | null;
  role?: Role | null;
}

/**
 * [Capa 5] Hook para consultar permisos en componentes de React.
 * Si no se provee un usuario o rol en las opciones, intenta obtenerlo de useAuthSession().
 */
export function usePermissions(options?: UsePermissionsOptions) {
  const session = useOptionalAuthSession();
  const sessionUser: PublicUser | null = session?.user ?? null;

  const activeUser = options?.user ?? sessionUser;
  const activeRole = options?.role ?? (activeUser?.role as Role | undefined) ?? null;

  return useMemo(() => {
    return {
      role: activeRole,
      user: activeUser,
      isAdmin: activeRole === Role.ADMIN,
      isReception: activeRole === Role.RECEPTION,
      isCleaning: activeRole === Role.CLEANING,
      canAccess: (moduleKey: ModuleKey | string): boolean => {
        return canAccessModule(activeRole, moduleKey);
      }
    };
  }, [activeRole, activeUser]);
}
