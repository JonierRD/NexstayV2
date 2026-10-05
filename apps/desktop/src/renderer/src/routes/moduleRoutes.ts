// [Capa 1] Catálogo centralizado de módulos con sus roles permitidos, navegación y contexto de IA.
//
// Fuente de verdad del acceso por módulo: `roles` vacío o ausente significa
// "cualquier usuario autenticado". Las vistas con `isPublic: true` son las únicas
// accesibles sin sesión. Sidebar, RouteGuard, security/permissions.ts y el Asistente IA leen de aquí.

import { createElement, type ReactElement } from 'react';
import {
  BedDouble,
  CalendarCheck,
  CalendarDays,
  Candy,
  Car,
  ClipboardList,
  ConciergeBell,
  DollarSign,
  Droplets,
  FileText,
  LayoutDashboard,
  Package,
  Settings,
  Shirt,
  ShoppingCart,
  UserCheck,
  UserCircle,
  Users,
  Wind
} from 'lucide-react';
import { AuthScreen } from '../components/auth/AuthScreen';
import { AuditoriaPage } from '../pages/AuditoriaPage';
import { ClientesPage } from '../pages/ClientesPage';
import { DashboardPage } from '../pages/DashboardPage';
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
  // ── Admin + Recepción (Módulos Principales) ─────────────────────────
  {
    key: 'dashboard',
    path: '/dashboard',
    meta: {
      title: 'Dashboard',
      roles: staff,
      section: 'main',
      icon: LayoutDashboard,
      assistantSummary:
        'Dashboard general del hotel con métricas de ocupación, ingresos estimados, stock bajo y accesos rápidos a check-in, habitaciones, ventas y atención al cliente.'
    },
    component: DashboardPage
  },
  {
    key: 'recepcion',
    path: '/recepcion',
    meta: {
      title: 'Recepción',
      roles: staff,
      section: 'main',
      icon: ConciergeBell,
      assistantSummary:
        'Recepción: gestión de llegadas, asignación de habitaciones, estados de reservas y atención inmediata del huésped.'
    },
    component: RecepcionPage
  },
  {
    key: 'reservas',
    path: '/reservas',
    meta: {
      title: 'Reservas',
      roles: staff,
      section: 'main',
      icon: CalendarCheck,
      assistantSummary:
        'Reservas: manejo de reservaciones, fechas de ingreso y salida, disponibilidad y confirmaciones.'
    },
    component: ModulePlaceholder
  },
  {
    key: 'huespedes',
    path: '/huespedes',
    meta: {
      title: 'Huéspedes',
      roles: staff,
      section: 'main',
      icon: UserCheck,
      assistantSummary:
        'Huéspedes activos: seguimiento de huéspedes en alojamiento, consumos y cierre de estancia.'
    },
    component: HuespedesPage
  },
  {
    key: 'habitaciones',
    path: '/habitaciones',
    meta: {
      title: 'Habitaciones',
      roles: staff,
      section: 'main',
      icon: BedDouble,
      assistantSummary:
        'Habitaciones: gestión de tipos, estados, precios, mantenimiento y disponibilidad de habitaciones.'
    },
    component: HabitacionesPage
  },
  {
    key: 'clientes',
    path: '/clientes',
    meta: {
      title: 'Clientes',
      roles: staff,
      section: 'main',
      icon: Users,
      assistantSummary:
        'Clientes: directorio de clientes, historial de hospedajes, edición de perfiles y eliminación con validación administrativa.'
    },
    component: ClientesPage
  },
  {
    key: 'ventas',
    path: '/ventas',
    meta: {
      title: 'Ventas',
      roles: staff,
      section: 'main',
      icon: ShoppingCart,
      assistantSummary:
        'Ventas: registro de ventas de tienda, inventario y cierre de consumo por huéspedes o clientes.'
    },
    component: VentasPage
  },
  {
    key: 'parqueadero',
    path: '/parqueadero',
    meta: {
      title: 'Parqueadero',
      roles: staff,
      section: 'main',
      icon: Car,
      assistantSummary:
        'Parqueadero: control de parqueadero mensual y gestión asociada al huésped o cliente.'
    },
    component: ModulePlaceholder
  },
  {
    key: 'lavanderia',
    path: '/lavanderia',
    meta: {
      title: 'Lavandería',
      roles: staff,
      section: 'main',
      icon: Shirt,
      assistantSummary:
        'Lavandería: control de órdenes, estados, precios y seguimiento de servicios de ropa.'
    },
    component: LavanderiaPage
  },
  {
    key: 'inventario',
    path: '/inventario',
    meta: {
      title: 'Inventario',
      roles: staff,
      section: 'main',
      icon: Package,
      assistantSummary:
        'Inventario: control de stock, productos, categorías, ajustes de existencia y alertas por bajo inventario.'
    },
    component: InventarioPage
  },

  // ── Módulos Futuros ────────────────────────────────────────────────
  {
    key: 'lavado',
    path: '/lavado',
    meta: {
      title: 'Lavado tanque',
      roles: staff,
      section: 'future',
      icon: Droplets,
      assistantSummary: 'Lavado tanque: registro y estado de servicios de lavado de tanque.'
    },
    component: ModulePlaceholder
  },
  {
    key: 'ingresos-gastos',
    path: '/ingresos-gastos',
    meta: {
      title: 'Ingresos y Gastos',
      roles: staff,
      section: 'future',
      icon: DollarSign,
      assistantSummary:
        'Ingresos y gastos: seguimiento de movimientos financieros del negocio y control de egresos.'
    },
    component: ModulePlaceholder
  },
  {
    key: 'semanario',
    path: '/semanario',
    meta: {
      title: 'Semanario',
      roles: staff,
      section: 'future',
      icon: CalendarDays,
      assistantSummary: 'Semanario: análisis del desempeño semanal del hotel y servicios.'
    },
    component: ModulePlaceholder
  },
  {
    key: 'aires',
    path: '/aires',
    meta: {
      title: 'Aires',
      roles: staff,
      section: 'future',
      icon: Wind,
      assistantSummary: 'Aires: control del servicio de aires en habitaciones o áreas.'
    },
    component: ModulePlaceholder
  },
  {
    key: 'mecato',
    path: '/mecato',
    meta: {
      title: 'Mecato',
      roles: staff,
      section: 'future',
      icon: Candy,
      assistantSummary:
        'Mecato: gestión de productos y consumos del punto de venta complementario.'
    },
    component: ModulePlaceholder
  },
  {
    key: 'facturas',
    path: '/facturas',
    meta: {
      title: 'Facturas',
      roles: staff,
      section: 'future',
      icon: FileText,
      assistantSummary: 'Facturas: revisión e impresión de comprobantes del negocio.'
    },
    component: ModulePlaceholder
  },

  // ── Solo Administrador ─────────────────────────────────────────────
  {
    key: 'auditoria',
    path: '/auditoria',
    meta: {
      title: 'Auditoría',
      roles: adminOnly,
      section: 'main',
      icon: ClipboardList,
      assistantSummary:
        'Auditoría: consulta del historial de movimientos, acciones administrativas y validación del sistema.'
    },
    component: AuditoriaPage
  },
  {
    key: 'perfil',
    path: '/perfil',
    meta: {
      title: 'Perfil',
      roles: staff,
      section: 'bottom',
      icon: UserCircle,
      assistantSummary: 'Perfil: visualización de información del usuario y cambio de contraseña.'
    },
    component: ModulePlaceholder
  },
  {
    key: 'config',
    path: '/config',
    meta: {
      title: 'Configuración',
      roles: adminOnly,
      section: 'bottom',
      icon: Settings,
      assistantSummary: 'Configuración: ajustes del sistema y administración general.'
    },
    component: ModulePlaceholder
  },
  {
    key: 'usuarios',
    path: '/usuarios',
    meta: {
      title: 'Usuarios',
      roles: adminOnly,
      assistantSummary: 'Usuarios: administración de cuentas y personal del hotel.'
    },
    component: ModulePlaceholder
  },
  {
    key: 'reportes-avanzados',
    path: '/reportes-avanzados',
    meta: {
      title: 'Reportes Avanzados',
      roles: adminOnly,
      assistantSummary: 'Reportes avanzados: informes analíticos de ocupación e ingresos.'
    },
    component: ModulePlaceholder
  },

  // ── Públicas (no requieren sesión) ─────────────────────────────────
  { key: 'login', path: '/login', meta: { title: 'Iniciar sesión', isPublic: true }, component: AuthScreen },
  { key: 'register', path: '/register', meta: { title: 'Crear cuenta', isPublic: true }, component: AuthScreen },
  { key: 'forgot-password', path: '/forgot-password', meta: { title: 'Recuperar contraseña', isPublic: true }, component: AuthScreen },
  { key: 'reset-password', path: '/reset-password', meta: { title: 'Restablecer contraseña', isPublic: true }, component: AuthScreen }
];