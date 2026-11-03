import { describe, expect, it } from 'vitest';
import { moduleRoutes } from '@/routes/moduleRoutes';
import { Role } from '@/routes/roles';
import { canAccessModule } from '@/security/permissions';

// Responsable: Jonier - U8: permisos de modulo derivados del catalogo de rutas.

describe('U8 - permisos de modulos', () => {
  it('CLEANING solo accede a habitaciones, lavanderia y perfil', () => {
    const allowed = ['habitaciones', 'lavanderia', 'perfil'];
    const protectedRoutes = moduleRoutes.filter((route) => !route.meta.isPublic);

    for (const route of protectedRoutes) {
      expect(canAccessModule(Role.CLEANING, route.key), route.key).toBe(
        allowed.includes(route.key)
      );
    }
  });
});
