import {
  getStoredToken,
  meRequest,
  setStoredToken,
  type PublicUser
} from '../lib/api';
import { Role, hasRole as checkRoleHierarchy } from '../routes/roles';

/**
 * [Capa 3] Servicio de cuenta desacoplado de la interfaz de usuario.
 * Maneja la persistencia de token, recuperación del perfil (/auth/me) y verificación de roles/autorizaciones.
 */
export class AccountService {
  /**
   * Obtiene el token JWT actualmente almacenado en el cliente.
   */
  getToken(): string | null {
    return getStoredToken();
  }

  /**
   * Guarda o actualiza el token JWT en el almacenamiento persistente.
   */
  saveToken(token: string): void {
    setStoredToken(token);
  }

  /**
   * Elimina el token JWT del almacenamiento persistente.
   */
  clearToken(): void {
    setStoredToken(null);
  }

  /**
   * Indica si existe un token almacenado en el cliente.
   */
  hasToken(): boolean {
    return Boolean(this.getToken());
  }

  /**
   * Recupera el perfil del usuario autenticado consultando el backend (/auth/me).
   * Si no hay token o la petición falla (ej. sesión vencida), limpia el almacenamiento y retorna null.
   */
  async retrieveAccount(): Promise<PublicUser | null> {
    const token = this.getToken();
    if (!token) {
      return null;
    }

    try {
      const user = await meRequest();
      return user;
    } catch (error) {
      // Si el token es inválido o expiró, se limpia el almacenamiento local
      this.clearToken();
      return null;
    }
  }

  /**
   * Comprueba si el usuario tiene un rol específico, respetando la jerarquía de roles (ADMIN >= RECEPTION).
   */
  hasRole(user: PublicUser | null, role: Role | string): boolean {
    if (!user) {
      return false;
    }
    const isKnownRole = Object.values(Role).includes(role as Role);
    const isUserRoleKnown = Object.values(Role).includes(user.role as Role);

    if (isKnownRole && isUserRoleKnown) {
      return checkRoleHierarchy(user.role as Role, role as Role);
    }

    return user.role === role;
  }

  /**
   * Comprueba si el usuario posee al menos uno de los roles especificados (o nivel jerárquico suficiente).
   * Si la lista de roles está vacía o no está definida, se asume acceso permitido.
   */
  hasAnyRole(user: PublicUser | null, roles?: (Role | string)[]): boolean {
    if (!roles || roles.length === 0) {
      return true;
    }
    if (!user) {
      return false;
    }
    return roles.some((role) => this.hasRole(user, role));
  }

  /**
   * Alias de compatibilidad para verificación de autorizaciones/roles.
   */
  hasAuthorities(user: PublicUser | null, authorities?: (Role | string)[]): boolean {
    return this.hasAnyRole(user, authorities);
  }
}

export const accountService = new AccountService();

// Exportaciones directas de utilidad para uso modular
export const getToken = (): string | null => accountService.getToken();
export const saveToken = (token: string): void => accountService.saveToken(token);
export const clearToken = (): void => accountService.clearToken();
export const hasToken = (): boolean => accountService.hasToken();
export const retrieveAccount = (): Promise<PublicUser | null> => accountService.retrieveAccount();
export const hasRole = (user: PublicUser | null, role: Role | string): boolean => accountService.hasRole(user, role);
export const hasAnyRole = (user: PublicUser | null, roles?: (Role | string)[]): boolean => accountService.hasAnyRole(user, roles);