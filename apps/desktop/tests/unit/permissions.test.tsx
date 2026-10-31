import { describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { AuthProvider } from '@/context/AuthContext';
import { moduleRoutes } from '@/routes/moduleRoutes';
import { Role } from '@/routes/roles';
import { canAccessModule } from '@/security/permissions';
import { usePermissions } from '@/security/usePermissions';
import { makeUser } from '../helpers/fixtures';

// Responsable: Jonier
// Capa 5: permisos de modulo + hook de React. Ambos leen del catalogo central
// (moduleRoutes) a traves de isRouteAllowed, por eso se prueban contra el.

const CLEANING_ALLOWED = ['habitaciones', 'lavanderia', 'perfil'];
const RECEPTION_DENIED = ['auditoria', 'config', 'usuarios', 'reportes-avanzados'];

// Modulos reales que exigen sesion (excluye login/register/recuperar).
const authenticatedModules = moduleRoutes.filter((route) => !route.meta.isPublic);

describe('canAccessModule', () => {
  it('devuelve false sin rol', () => {
    expect(canAccessModule(null, 'dashboard')).toBe(false);
    expect(canAccessModule(undefined, 'habitaciones')).toBe(false);
  });

  it('devuelve false para un modulo inexistente', () => {
    expect(canAccessModule(Role.ADMIN, 'modulo-que-no-existe')).toBe(false);
  });

  it('CLEANING solo accede a habitaciones, lavanderia y perfil', () => {
    CLEANING_ALLOWED.forEach((key) => {
      expect(canAccessModule(Role.CLEANING, key), key).toBe(true);
    });

    authenticatedModules
      .filter((route) => !CLEANING_ALLOWED.includes(route.key))
      .forEach((route) => {
        expect(canAccessModule(Role.CLEANING, route.key), route.key).toBe(false);
      });
  });

  it('RECEPTION no accede a auditoria ni configuracion', () => {
    expect(canAccessModule(Role.RECEPTION, 'dashboard')).toBe(true);
    expect(canAccessModule(Role.RECEPTION, 'habitaciones')).toBe(true);

    RECEPTION_DENIED.forEach((key) => {
      expect(canAccessModule(Role.RECEPTION, key), key).toBe(false);
    });
  });

  it('ADMIN accede a todos los modulos de staff', () => {
    authenticatedModules.forEach((route) => {
      expect(canAccessModule(Role.ADMIN, route.key), route.key).toBe(true);
    });
  });
});

describe('usePermissions', () => {
  it('expone role, isAdmin, isReception e isCleaning', () => {
    const reception = renderHook(() =>
      usePermissions({ user: makeUser({ role: 'RECEPTION' }) })
    );
    expect(reception.result.current.role).toBe(Role.RECEPTION);
    expect(reception.result.current.isReception).toBe(true);
    expect(reception.result.current.isAdmin).toBe(false);
    expect(reception.result.current.isCleaning).toBe(false);
    expect(reception.result.current.canAccess('dashboard')).toBe(true);
    expect(reception.result.current.canAccess('auditoria')).toBe(false);

    const admin = renderHook(() => usePermissions({ role: Role.ADMIN }));
    expect(admin.result.current.isAdmin).toBe(true);
    expect(admin.result.current.canAccess('auditoria')).toBe(true);

    const cleaning = renderHook(() => usePermissions({ role: Role.CLEANING }));
    expect(cleaning.result.current.isCleaning).toBe(true);
    expect(cleaning.result.current.canAccess('dashboard')).toBe(false);
  });

  it('toma el usuario del AuthProvider si no recibe opciones', () => {
    const user = makeUser({ id: 'user-cleaning', role: 'CLEANING' });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <AuthProvider initialUser={user}>{children}</AuthProvider>
    );

    const { result } = renderHook(() => usePermissions(), { wrapper });

    expect(result.current.user).toEqual(user);
    expect(result.current.role).toBe(Role.CLEANING);
    expect(result.current.isCleaning).toBe(true);
    expect(result.current.canAccess('habitaciones')).toBe(true);
    expect(result.current.canAccess('dashboard')).toBe(false);
  });
});
