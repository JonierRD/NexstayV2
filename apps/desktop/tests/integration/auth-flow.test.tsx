import { describe, it } from 'vitest';

// Responsable: Jonier
// Objetivo: flujo de autenticacion completo (integracion de UI).
//
// Estrategia recomendada: mockear la capa API, no fetch.
//   vi.mock('@/lib/api', async (importOriginal) => ({ ...(await importOriginal()), ... }));
//   vi.mock('@/lib/api/auth', ...);
// Luego renderizar <App /> y recorrer:
//   landing -> "Iniciar sesion" -> credenciales -> dashboard -> sidebar -> logout.
//
// Casos minimos:
//   - login exitoso como ADMIN muestra todos los modulos.
//   - login como CLEANING solo muestra Habitaciones, Lavanderia y Perfil.
//   - credenciales invalidas muestran el mensaje de error y NO dejan sesion.
//   - logout vuelve al login y limpia el token.

describe('I1 - Flujo de autenticacion y permisos', () => {
  it.todo('login exitoso lleva al dashboard con los modulos del rol');
  it.todo('un rol sin permiso no ve los modulos restringidos en el sidebar');
  it.todo('credenciales invalidas muestran error y no abren sesion');
  it.todo('cerrar sesion vuelve al login y limpia el token guardado');
});
