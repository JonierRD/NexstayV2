// [Capa 1] Catálogo centralizado de módulos con sus roles permitidos
//
// Matriz de permisos NexstayV2:
//   - ADMIN solamente:            auditoria, config, usuarios, reportes-avanzados
//   - ADMIN + RECEPTION:          recepcion, habitaciones, huespedes, reservas,
//                                 clientes, ventas, lavanderia, parqueadero,
//                                 perfil, dashboard (+ inventario y módulos futuros)
//   - Públicas (isPublic: true):  login, register, forgot-password, reset-password

import { createElement, type ReactElement } from 'react';
import { AuthScreen } from '../components/auth/AuthScreen';
import { AuditoriaPage } from '../pages/AuditoriaPage';
import { ClientesPage } from '../pages/ClientesPage';
import { HabitacionesPage } from '../pages/HabitacionesPage';
import { HuespedesPage } from '../pages/HuespedesPage';
import { InventarioPage } from '../pages/InventarioPage';
import { LavanderiaPage } from '../pages/LavanderiaPage';
import { RecepcionPage } from '../pages/RecepcionPage';
import { VentasPage } from '../pages/VentasPage';
import { Role } from './roles';
import { type AppRoute } from './types';

const staff = [Role.ADMIN, Role.RECEPTION];
const adminOnly = [Role.ADMIN];

// Vista provisional para módulos aún no implementados.
function ModulePlaceholder(): ReactElement {
  return createElement(
    'div',
    {
      className:
        'flex h-full items-center justify-center rounded-lg border border-dashed border-[hsl(var(--border))] bg-white p-6 text-center text-xs text-[hsl(var(--muted-foreground))]'
    },
    'Módulo en desarrollo'
  );
}

export const moduleRoutes: AppRoute[] = [
  // ── Admin + Recepción ──────────────────────────────────────────────
  { key: 'dashboard', path: '/dashboard', meta: { title: 'Dashboard', roles: staff }, component: ModulePlaceholder },
  { key: 'recepcion', path: '/recepcion', meta: { title: 'Recepción', roles: staff }, component: RecepcionPage },
  { key: 'reservas', path: '/reservas', meta: { title: 'Reservas', roles: staff }, component: ModulePlaceholder },
  { key: 'huespedes', path: '/huespedes', meta: { title: 'Huéspedes', roles: staff }, component: HuespedesPage },
  { key: 'habitaciones', path: '/habitaciones', meta: { title: 'Habitaciones', roles: staff }, component: HabitacionesPage },
  { key: 'clientes', path: '/clientes', meta: { title: 'Clientes', roles: staff }, component: ClientesPage },
  { key: 'ventas', path: '/ventas', meta: { title: 'Ventas', roles: staff }, component: VentasPage },
  { key: 'parqueadero', path: '/parqueadero', meta: { title: 'Parqueadero', roles: staff }, component: ModulePlaceholder },
  { key: 'lavanderia', path: '/lavanderia', meta: { title: 'Lavandería', roles: staff }, component: LavanderiaPage },
  { key: 'inventario', path: '/inventario', meta: { title: 'Inventario', roles: staff }, component: InventarioPage },
  { key: 'lavado', path: '/lavado', meta: { title: 'Lavado tanque', roles: staff }, component: ModulePlaceholder },
  { key: 'ingresos-gastos', path: '/ingresos-gastos', meta: { title: 'Ingresos y Gastos', roles: staff }, component: ModulePlaceholder },
  { key: 'semanario', path: '/semanario', meta: { title: 'Semanario', roles: staff }, component: ModulePlaceholder },
  { key: 'aires', path: '/aires', meta: { title: 'Aires', roles: staff }, component: ModulePlaceholder },
  { key: 'mecato', path: '/mecato', meta: { title: 'Mecato', roles: staff }, component: ModulePlaceholder },
  { key: 'facturas', path: '/facturas', meta: { title: 'Facturas', roles: staff }, component: ModulePlaceholder },
  { key: 'perfil', path: '/perfil', meta: { title: 'Perfil', roles: staff }, component: ModulePlaceholder },

  // ── Solo Administrador ─────────────────────────────────────────────
  { key: 'auditoria', path: '/auditoria', meta: { title: 'Auditoría', roles: adminOnly }, component: AuditoriaPage },
  { key: 'config', path: '/config', meta: { title: 'Configuración', roles: adminOnly }, component: ModulePlaceholder },
  { key: 'usuarios', path: '/usuarios', meta: { title: 'Usuarios', roles: adminOnly }, component: ModulePlaceholder },
  { key: 'reportes-avanzados', path: '/reportes-avanzados', meta: { title: 'Reportes Avanzados', roles: adminOnly }, component: ModulePlaceholder },

  // ── Públicas (no requieren sesión) ─────────────────────────────────
  { key: 'login', path: '/login', meta: { title: 'Iniciar sesión', isPublic: true }, component: AuthScreen },
  { key: 'register', path: '/register', meta: { title: 'Crear cuenta', isPublic: true }, component: AuthScreen },
  { key: 'forgot-password', path: '/forgot-password', meta: { title: 'Recuperar contraseña', isPublic: true }, component: AuthScreen },
  { key: 'reset-password', path: '/reset-password', meta: { title: 'Restablecer contraseña', isPublic: true }, component: AuthScreen }
];