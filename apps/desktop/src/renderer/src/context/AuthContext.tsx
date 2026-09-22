import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from 'react';
import type { PublicUser } from '../lib/api';
import type { Role } from '../routes/roles';
import { accountService } from '../services/account.service';

/**
 * [Capa 3] Contrato del contexto de sesión e identidad.
 */
export interface AuthContextType {
  user: PublicUser | null;
  isAuthenticated: boolean;
  isRestoringSession: boolean;
  hasRole: (role: Role) => boolean;
  hasAnyRole: (roles: Role[]) => boolean;
  login: (token: string, user: PublicUser) => void;
  logout: (reason?: string) => void;
  refreshAccount: () => Promise<PublicUser | null>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Proveedor de contexto de autenticación y autorización.
 * Centraliza la restauración de sesión al arrancar la app, y expone helpers de roles.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [isRestoringSession, setIsRestoringSession] = useState<boolean>(true);

  const isAuthenticated = Boolean(user);

  /**
   * Refresca la información del usuario autenticado desde el servidor.
   */
  const refreshAccount = useCallback(async (): Promise<PublicUser | null> => {
    const freshUser = await accountService.retrieveAccount();
    setUser(freshUser);
    return freshUser;
  }, []);

  /**
   * Inicia sesión guardando el token y estableciendo el usuario en memoria.
   */
  const login = useCallback((token: string, newUser: PublicUser): void => {
    accountService.saveToken(token);
    setUser(newUser);
  }, []);

  /**
   * Cierra la sesión activa, eliminando credenciales persistidas.
   */
  const logout = useCallback((_reason?: string): void => {
    accountService.clearToken();
    setUser(null);
  }, []);

  /**
   * Verifica si el usuario actual posee un rol específico.
   */
  const hasRole = useCallback(
    (role: Role): boolean => {
      return accountService.hasRole(user, role);
    },
    [user]
  );

  /**
   * Verifica si el usuario actual posee al menos uno de los roles solicitados.
   */
  const hasAnyRole = useCallback(
    (roles: Role[]): boolean => {
      return accountService.hasAnyRole(user, roles);
    },
    [user]
  );

  // 1) Restauración de sesión en el montaje inicial (auto-recuperación al iniciar Electron)
  useEffect(() => {
    let isMounted = true;

    async function restoreSession(): Promise<void> {
      try {
        const restoredUser = await accountService.retrieveAccount();
        if (isMounted) {
          setUser(restoredUser);
        }
      } catch {
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsRestoringSession(false);
        }
      }
    }

    void restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  // 2) Escucha desacoplada para eventos de Capa 4 (401 Unauthorized / auto-logout)
  useEffect(() => {
    const handleUnauthorizedEvent = (event: Event) => {
      const customEvent = event as CustomEvent<{ reason?: string }>;
      const reason = customEvent.detail?.reason ?? 'Sesión expirada o no autorizada';
      logout(reason);
    };

    window.addEventListener('sapay:auth:unauthorized', handleUnauthorizedEvent);
    window.addEventListener('auth:unauthorized', handleUnauthorizedEvent);

    return () => {
      window.removeEventListener('sapay:auth:unauthorized', handleUnauthorizedEvent);
      window.removeEventListener('auth:unauthorized', handleUnauthorizedEvent);
    };
  }, [logout]);

  const contextValue = useMemo<AuthContextType>(
    () => ({
      user,
      isAuthenticated,
      isRestoringSession,
      hasRole,
      hasAnyRole,
      login,
      logout,
      refreshAccount
    }),
    [user, isAuthenticated, isRestoringSession, hasRole, hasAnyRole, login, logout, refreshAccount]
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

/**
 * Hook de acceso al contexto de autenticación y autorización.
 */
export function useAuthSession(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthSession debe ser utilizado dentro de un AuthProvider.');
  }
  return context;
}