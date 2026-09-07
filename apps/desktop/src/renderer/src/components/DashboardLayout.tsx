import { type ReactElement, useState } from 'react';
import { Bell, CalendarDays, LogOut, PanelRightClose } from 'lucide-react';
import type { PublicUser } from '../lib/api';
import { HabitacionesPage } from './HabitacionesPage';
import { AuditoriaPage } from './AuditoriaPage';
import { RecepcionPage } from './RecepcionPage';
import { LavanderiaPage } from './LavanderiaPage';
import { ClientesPage } from './ClientesPage';
import { HuespedesPage } from './HuespedesPage';
import { InventarioPage } from './InventarioPage';
import { type ModuleKey, Sidebar } from './Sidebar';
import { AssistantChat } from './AssistantChat';

type PageComponent = (props: { user: PublicUser }) => ReactElement;

const pages: Record<ModuleKey, PageComponent> = {
  dashboard: () => <PageShell title="Dashboard" subtitle="Resumen del hotel" />,
  recepcion: ({ user }) => <RecepcionPage user={user} />,
  reservas: () => <PageShell title="Reservas" subtitle="Gestión de reservas" />,
  huespedes: ({ user }) => <HuespedesPage user={user} />,
  habitaciones: ({ user }) => <HabitacionesPage user={user} />,
  clientes: ({ user }) => <ClientesPage user={user} />,
  ventas: () => <PageShell title="Ventas" subtitle="Inventario y ventas de tienda" />,
  parqueadero: () => <PageShell title="Parqueadero" subtitle="Parqueadero mensual" />,
  auditoria: ({ user }) => <AuditoriaPage user={user} />,
  lavanderia: ({ user }) => <LavanderiaPage user={user} />,
  inventario: ({ user }) => <InventarioPage user={user} />,
  lavado: () => <PageShell title="Lavado tanque" subtitle="Próximamente" future />,
  'ingresos-gastos': () => <PageShell title="Ingresos y Gastos" subtitle="Próximamente" future />,
  semanario: () => <PageShell title="Semanario" subtitle="Próximamente" future />,
  aires: () => <PageShell title="Aires" subtitle="Próximamente" future />,
  mecato: () => <PageShell title="Mecato" subtitle="Próximamente" future />,
  facturas: () => <PageShell title="Facturas" subtitle="Próximamente" future />,
  perfil: () => <PageShell title="Perfil" subtitle="Datos del usuario" />,
  config: () => <PageShell title="Configuración" subtitle="Ajustes del sistema" />
};

function PageShell({ title, subtitle, future, children }: {
  title: string;
  subtitle: string;
  future?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex h-full flex-col p-4">
      <div className="mb-3">
        <h1 className="text-sm font-semibold">{title}</h1>
        <p className="text-[10px] text-[hsl(var(--muted-foreground))]">{subtitle}</p>
      </div>
      {future && (
        <div className="rounded-lg border border-dashed border-[hsl(var(--border))] bg-white p-6 text-center text-xs text-[hsl(var(--muted-foreground))]">
          Módulo en desarrollo
        </div>
      )}
      {children}
    </div>
  );
}

type DashboardLayoutProps = {
  user: PublicUser;
  onLogout: () => void;
};

const pageTitles: Record<ModuleKey, string> = {
  dashboard: 'Dashboard',
  recepcion: 'Recepción',
  reservas: 'Reservas',
  huespedes: 'Huéspedes',
  habitaciones: 'Habitaciones',
  clientes: 'Clientes',
  ventas: 'Ventas',
  parqueadero: 'Parqueadero',
  auditoria: 'Auditoría',
  lavanderia: 'Lavandería',
  inventario: 'Inventario',
  lavado: 'Lavado tanque',
  'ingresos-gastos': 'Ingresos y Gastos',
  semanario: 'Semanario',
  aires: 'Aires',
  mecato: 'Mecato',
  facturas: 'Facturas',
  perfil: 'Perfil',
  config: 'Configuración'
};

export function DashboardLayout({ user, onLogout }: DashboardLayoutProps): ReactElement {
  const [active, setActive] = useState<ModuleKey>('recepcion');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const Page = pages[active];
  const now = new Date();
  const formattedDate = new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(now);
  const formattedTime = new Intl.DateTimeFormat('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).format(now);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        active={active}
        onNavigate={setActive}
        onLogout={onLogout}
        open={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />
      <div className="flex flex-1 flex-col min-w-0">
        <header className="flex h-11 items-center gap-3 border-b border-[#eadfd6] bg-[#fbf8f4] px-5">
          {!sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
            >
              <PanelRightClose size={16} />
            </button>
          )}
          <span className="text-[13px] font-semibold tracking-tight text-[#2b1b14]">{pageTitles[active]}</span>
          <div className="flex-1" />

          <div className="flex items-center gap-2 rounded-[16px] border border-[#eadfd6] bg-[#fbf8f4] px-3 py-1.5 text-[#4b2b21] shadow-[0_10px_24px_rgba(67,42,27,0.06)]">
            <CalendarDays size={15} aria-hidden="true" />
            <div className="leading-tight">
              <p className="text-[11px] font-medium">{formattedDate}</p>
              <p className="text-[10px] text-[#7a6a60]">{formattedTime}</p>
            </div>
          </div>

          <button
            type="button"
            className="relative flex h-9 w-9 items-center justify-center rounded-[14px] border border-[#eadfd6] bg-white text-[#4b2b21] shadow-[0_10px_24px_rgba(67,42,27,0.06)] transition hover:border-[#cdb9ab] hover:bg-[#fff9f5]"
            aria-label="Notificaciones"
          >
            <Bell size={16} aria-hidden="true" />
            <span className="absolute right-0.5 top-0.5 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-[#cf3d2e] text-[9px] font-semibold text-white shadow-md" />
          </button>

          <span className="h-4 w-px bg-[hsl(var(--border))]" />
          <div className="flex items-center gap-2">
            <div className="text-right">
              <p className="text-[11px] font-medium leading-tight">{user.fullName}</p>
              <p className="text-[9px] text-[hsl(var(--muted-foreground))]">{user.role === 'ADMIN' ? 'Administrador' : 'Recepcionista'}</p>
            </div>
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-semibold text-white">
              {user.fullName.charAt(0)}
            </div>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-1 text-[10px] text-red-500 hover:text-red-600 transition-colors"
          >
            <LogOut size={13} />
            Salir
          </button>
        </header>
        <div className="flex min-h-0 flex-1 flex-col bg-[hsl(var(--background))]">
          <Page user={user} />
          <AssistantChat user={user} pageKey={active} pageTitle={pageTitles[active]} />
        </div>
      </div>
    </div>
  );
}
