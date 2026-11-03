import { describe, expect, it } from 'vitest';
import { Role } from '@/routes/roles';
import { isRouteAllowed } from '@/routes/routeAccess';
import type { AppRoute } from '@/routes/types';

// Responsable: Jonier - U7: reglas centrales de acceso por rol.

describe('U7 - acceso a rutas por rol', () => {
  it('solo ADMIN puede acceder a una ruta exclusiva de administracion', () => {
    const adminRoute: AppRoute = {
      key: 'auditoria',
      path: '/auditoria',
      meta: { title: 'Auditoria', roles: [Role.ADMIN] },
      component: () => null
    };

    expect(isRouteAllowed(Role.ADMIN, adminRoute)).toBe(true);
    expect(isRouteAllowed(Role.RECEPTION, adminRoute)).toBe(false);
    expect(isRouteAllowed(Role.CLEANING, adminRoute)).toBe(false);
  });
});
