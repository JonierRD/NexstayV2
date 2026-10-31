import { describe, it } from 'vitest';

// Responsable: Jonier
// Objetivo: capa 5 de permisos y su hook.
//   import { canAccessModule } from '@/security/permissions';
//   import { usePermissions } from '@/security/usePermissions';
//   import { Role } from '@/routes/roles';
//   import { renderHook } from '@testing-library/react';
//   import { renderWithAuth, screen } from '../helpers/render';
//   import { makeUser } from '../helpers/fixtures';

describe('U8 - security/permissions.ts y usePermissions.ts', () => {
  it.todo('canAccessModule devuelve false sin rol');
  it.todo('canAccessModule devuelve false para un modulo inexistente');
  it.todo('CLEANING solo accede a habitaciones, lavanderia y perfil');
  it.todo('RECEPTION no accede a auditoria ni configuracion');
  it.todo('ADMIN accede a todos los modulos de staff');
  it.todo('usePermissions expone role, isAdmin, isReception e isCleaning');
  it.todo('usePermissions toma el usuario del AuthProvider si no recibe opciones');
});
