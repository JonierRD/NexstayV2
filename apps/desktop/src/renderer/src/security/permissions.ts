import { Role } from '../routes/roles';
import { findRoute, isRouteAllowed } from '../routes/routeAccess';
import type { ModuleKey } from '../routes/types';

/**
 * [Capa 5] Control de acceso del cliente.
 *
 * Este módulo responde UNA sola pregunta: ¿puede este rol ver y abrir este módulo?
 * La respuesta sale del catálogo centralizado de moduleRoutes (Capa 1) a través de
 * isRouteAllowed, de modo que Sidebar, RouteGuard y cualquier componente consultan
 * exactamente la misma fuente de verdad.
 *
* IMPORTANTE — por qué no hay una matriz de acciones aquí:
 * la validación por acción vive en el servidor, y solo se aplica donde de verdad
 * hace falta. Hoy la doble verificación de administrador (assertAdminPassword) cubre:
 *   - crear, editar y eliminar clientes de forma manual;
 *   - eliminar una habitación.
 * El resto del flujo operativo (check-in, check-out/liberar, inventario, lavandería)
 * NO pide contraseña: son el trabajo normal de recepción. Los clientes de un
 * hospedaje los crea el propio check-in, sin intervención manual.
 *
 * Una matriz de permisos por acción en el frontend sería contradictoria con ese
 * diseño y, además, no añadiría seguridad porque el frontend no es una frontera de
 * confianza.
 */
export function canAccessModule(
  role: Role | null | undefined,
  moduleKey: ModuleKey | string
): boolean {
  if (!role) {
    return false;
  }

  const route = findRoute(moduleKey);
  if (!route) {
    return false;
  }

  return isRouteAllowed(role, route);
}