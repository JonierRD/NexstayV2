// [Capa 1] Enum de roles y jerarquías de acceso (ADMIN, RECEPTION, CLEANING)

export enum Role {
  ADMIN = 'ADMIN',
  RECEPTION = 'RECEPTION',
  CLEANING = 'CLEANING'
}

// Nivel de cada rol: mayor nivel → más privilegios (ADMIN puede todo lo de RECEPTION).
// CLEANING (personal de limpieza) está en nivel 0: solo accede a los módulos donde
// se le lista explícitamente (Habitaciones, Lavandería, Perfil), sin heredar los
// de recepción.
const ROLE_LEVEL: Record<Role, number> = {
  [Role.ADMIN]: 2,
  [Role.RECEPTION]: 1,
  [Role.CLEANING]: 0
};

// Verifica si un usuario con userRole puede acceder a lo que exige required.
export function hasRole(userRole: Role, required: Role): boolean {
  return ROLE_LEVEL[userRole] >= ROLE_LEVEL[required];
}