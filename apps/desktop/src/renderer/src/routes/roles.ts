// [Capa 1] Enum de roles y jerarquías de acceso (ADMIN, RECEPTION)

export enum Role {
  ADMIN = 'ADMIN',
  RECEPTION = 'RECEPTION'
}

// Nivel de cada rol: mayor nivel → más privilegios (ADMIN puede todo lo de RECEPTION).
const ROLE_LEVEL: Record<Role, number> = {
  [Role.ADMIN]: 2,
  [Role.RECEPTION]: 1
};

// Verifica si un usuario con userRole puede acceder a lo que exige required.
export function hasRole(userRole: Role, required: Role): boolean {
  return ROLE_LEVEL[userRole] >= ROLE_LEVEL[required];
}