import { describe, expect, it } from 'vitest';
import { Role, hasRole } from '@/routes/roles';
import { findRoute, getAllowedRoutes, isRouteAllowed } from '@/routes/routeAccess';
import { moduleRoutes } from '@/routes/moduleRoutes';
import type { AppRoute } from '@/routes/types';

// Responsable: Jonier
// Capa 1: jerarquia de roles y acceso a rutas. Es la fuente de verdad que
// consumen el RouteGuard, el Sidebar y security/permissions.ts.

/** Construye una ruta minima para probar una regla sin depender del catalogo. */
function makeRoute(key: AppRoute['key'], meta: AppRoute['meta']): AppRoute {
  return { key, path: `/${key}`, meta, component: () => null };
}

const publicRoute = makeRoute('login', { title: 'Iniciar sesión', isPublic: true });
const openRoute = makeRoute('perfil', { title: 'Perfil' });
const staffRoute = makeRoute('dashboard', {
  title: 'Dashboard',
  roles: [Role.ADMIN, Role.RECEPTION]
});
const adminOnlyRoute = makeRoute('auditoria', { title: 'Auditoría', roles: [Role.ADMIN] });

const ALL_ROLES: Role[] = [Role.ADMIN, Role.RECEPTION, Role.CLEANING];

describe('hasRole', () => {
  it('respeta ADMIN >= RECEPTION >= CLEANING', () => {
    // Un rol hereda los permisos de los niveles inferiores, nunca al reves.
    const allowed: Record<Role, Role[]> = {
      [Role.ADMIN]: [Role.ADMIN, Role.RECEPTION, Role.CLEANING],
      [Role.RECEPTION]: [Role.RECEPTION, Role.CLEANING],
      [Role.CLEANING]: [Role.CLEANING]
    };

    ALL_ROLES.forEach((userRole) => {
      ALL_ROLES.forEach((required) => {
        expect(hasRole(userRole, required), `${userRole} -> ${required}`).toBe(
          allowed[userRole].includes(required)
        );
      });
    });
  });
});

describe('isRouteAllowed', () => {
  it('permite siempre las rutas publicas', () => {
    ALL_ROLES.forEach((role) => {
      expect(isRouteAllowed(role, publicRoute)).toBe(true);
    });

    // Tambien con la ruta real del catalogo.
    const login = findRoute('login');
    expect(login).toBeDefined();
    expect(isRouteAllowed(Role.CLEANING, login!)).toBe(true);
  });

  it('permite rutas sin roles a cualquier usuario autenticado', () => {
    expect(isRouteAllowed(Role.CLEANING, openRoute)).toBe(true);
    expect(isRouteAllowed(Role.RECEPTION, openRoute)).toBe(true);
    expect(isRouteAllowed(Role.ADMIN, openRoute)).toBe(true);
  });

  it('exige al menos un rol requerido y respeta la jerarquia', () => {
    expect(isRouteAllowed(Role.ADMIN, adminOnlyRoute)).toBe(true);
    expect(isRouteAllowed(Role.RECEPTION, adminOnlyRoute)).toBe(false);
    expect(isRouteAllowed(Role.CLEANING, adminOnlyRoute)).toBe(false);

    // ADMIN puede entrar a un modulo de recepcion por herencia de nivel.
    expect(isRouteAllowed(Role.ADMIN, staffRoute)).toBe(true);
    expect(isRouteAllowed(Role.RECEPTION, staffRoute)).toBe(true);
    expect(isRouteAllowed(Role.CLEANING, staffRoute)).toBe(false);
  });
});

describe('catalogo de rutas', () => {
  it('findRoute devuelve la ruta por key y undefined si no existe', () => {
    expect(findRoute('dashboard')).toMatchObject({
      key: 'dashboard',
      path: '/dashboard'
    });
    expect(findRoute('no-existe')).toBeUndefined();
  });

  it('getAllowedRoutes filtra el catalogo segun el rol', () => {
    const keysFor = (role: Role): string[] =>
      getAllowedRoutes(role).map((route) => route.key);

    const cleaning = keysFor(Role.CLEANING);
    expect(cleaning).toEqual(
      expect.arrayContaining(['habitaciones', 'lavanderia', 'perfil'])
    );
    expect(cleaning).not.toContain('dashboard');
    expect(cleaning).not.toContain('auditoria');
    expect(cleaning).not.toContain('config');

    const reception = keysFor(Role.RECEPTION);
    expect(reception).toContain('dashboard');
    expect(reception).not.toContain('auditoria');
    expect(reception).not.toContain('config');

    const admin = keysFor(Role.ADMIN);
    expect(admin).toContain('auditoria');
    expect(admin).toContain('config');
    // El administrador es el unico rol que ve el catalogo completo.
    expect(admin).toHaveLength(moduleRoutes.length);
  });

  it('no tiene keys duplicadas', () => {
    const keys = moduleRoutes.map((route) => route.key);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
