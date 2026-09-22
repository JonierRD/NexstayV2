// [Capa 1] Contratos del sistema de rutas: AppRoute, RouteMeta, ModuleKey

import type { ComponentType } from 'react';
import type { Role } from './roles';

// Todas las claves de módulo navegables (coinciden con ModuleKey del Sidebar,
// más las vistas públicas de autenticación y módulos administrativos futuros).
export type ModuleKey =
  | 'dashboard'
  | 'recepcion'
  | 'reservas'
  | 'huespedes'
  | 'habitaciones'
  | 'clientes'
  | 'ventas'
  | 'parqueadero'
  | 'auditoria'
  | 'lavanderia'
  | 'inventario'
  | 'lavado'
  | 'ingresos-gastos'
  | 'semanario'
  | 'aires'
  | 'mecato'
  | 'facturas'
  | 'perfil'
  | 'config'
  | 'usuarios'
  | 'reportes-avanzados'
  | 'login'
  | 'register'
  | 'forgot-password'
  | 'reset-password';

export interface RouteMeta {
  title: string;
  // roles vacío o undefined → accesible para cualquier usuario autenticado
  roles?: Role[];
  // true → vista anónima (Login, Registro, Recuperar contraseña)
  isPublic?: boolean;
}

export interface AppRoute {
  key: ModuleKey;
  path: string;
  meta: RouteMeta;
  component: ComponentType<any>;
}