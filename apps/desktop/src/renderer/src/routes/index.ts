// [Capa 1] Exportación unificada del sistema de rutas

export * from './roles';
export * from './types';
export { moduleRoutes } from './moduleRoutes';
export { findRoute, getAllowedRoutes, isRouteAllowed } from './routeAccess';
export { RouteGuard } from './RouteGuard';