import { createElement, type ReactElement, useEffect, useState } from 'react';
import { Bell, CalendarDays, LogOut, PanelRightClose } from 'lucide-react';
import type { PublicUser } from '../lib/api';
import { formatClock, formatHeaderDate } from '../lib/format';
import { useAuthSession } from '../context/AuthContext';
import { Sidebar } from './Sidebar';
import { AssistantChat } from './AssistantChat';
import { RouteGuard } from '../routes/RouteGuard';
import { findRoute } from '../routes/routeAccess';
import type { ModuleKey } from '../routes/types';

type DashboardLayoutProps = {
  user: PublicUser;
  onLogout: () => void;
};

export function DashboardLayout({ user, onLogout }: DashboardLayoutProps): ReactElement {
  const { user: sessionUser } = useAuthSession();
  const resolvedUser = user ?? sessionUser ?? null;
  const [active, setActive] = useState<ModuleKey>('recepcion');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const route = findRoute(active);
  const pageTitle = route?.meta.title ?? 'SAPAY';

  // El reloj debe avanzar solo; calcularlo en el render lo dejaba congelado
  // hasta que ocurriera otro re-render sin relacion.
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let timeoutId = 0;

    // Ajusta al minuto en curso para que los minutos no cambien a destiempo.
    const scheduleTick = () => {
      const msUntilNextMinute = 60000 - (Date.now() % 60000);
      timeoutId = window.setTimeout(() => {
        setNow(new Date());
        scheduleTick();
      }, msUntilNextMinute);
    };

    scheduleTick();

    return () => window.clearTimeout(timeoutId);
  }, []);

  const formattedDate = formatHeaderDate(now);
  const formattedTime = formatClock(now);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        active={active}
        onNavigate={setActive}
        onLogout={onLogout}
        open={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        user={resolvedUser}
      />
      <div className="flex flex-1 flex-col min-w-0">
        <header className="flex h-11 items-center gap-3 border-b border-sapay-350 bg-[#fbf8f4] px-5">
          {!sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
            >
              <PanelRightClose size={16} />
            </button>
          )}
          <span className="text-[13px] font-semibold tracking-tight text-sapay-950">{pageTitle}</span>
          <div className="flex-1" />

          <div className="flex items-center gap-2 rounded-[16px] border border-sapay-350 bg-[#fbf8f4] px-3 py-1.5 text-sapay-900 shadow-[0_10px_24px_rgba(67,42,27,0.06)]">
            <CalendarDays size={15} aria-hidden="true" />
            <div className="leading-tight">
              <p className="text-[11px] font-medium">{formattedDate}</p>
              <p className="text-[10px] text-[#7a6a60]">{formattedTime}</p>
            </div>
          </div>

          <button
            type="button"
            className="relative flex h-9 w-9 items-center justify-center rounded-[14px] border border-sapay-350 bg-white text-sapay-900 shadow-[0_10px_24px_rgba(67,42,27,0.06)] transition hover:border-[#cdb9ab] hover:bg-[#fff9f5]"
            aria-label="Notificaciones"
          >
            <Bell size={16} aria-hidden="true" />
            <span className="absolute right-0.5 top-0.5 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-[#cf3d2e] text-[9px] font-semibold text-white shadow-md" />
          </button>

          <span className="h-4 w-px bg-[hsl(var(--border))]" />
          <div className="flex items-center gap-2">
            <div className="text-right">
              <p className="text-[11px] font-medium leading-tight">{resolvedUser?.fullName ?? 'Usuario'}</p>
              <p className="text-[9px] text-[hsl(var(--muted-foreground))]">{resolvedUser?.role === 'ADMIN' ? 'Administrador' : 'Recepcionista'}</p>
            </div>
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-semibold text-white">
              {(resolvedUser?.fullName ?? 'U').charAt(0)}
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
          <RouteGuard
            activeModule={active}
            user={resolvedUser ?? undefined}
            onNavigateHome={() => setActive('recepcion')}
          >
            {route ? createElement(route.component, { user: resolvedUser ?? user }) : null}
          </RouteGuard>
          <AssistantChat user={resolvedUser ?? user} pageKey={active} pageTitle={pageTitle} />
        </div>
      </div>
    </div>
  );
}
