import { createElement, type ReactElement, useEffect, useState } from 'react';
import { Bell, CalendarDays, ChevronDown, LogOut, PanelRightClose, Settings, UserRound } from 'lucide-react';
import type { PublicUser } from '../../lib/api';
import { formatClock, formatHeaderDate } from '../../lib/format';
import { useBreakpoint } from '../../lib/useBreakpoint';
import { useAuthSession } from '../../context/AuthContext';
import { Sidebar } from './Sidebar';
import { AssistantChat } from '../assistant/AssistantChat';
import { RouteGuard } from '../../routes/RouteGuard';
import { findRoute, getAllowedRoutes } from '../../routes/routeAccess';
import { Role } from '../../routes/roles';
import type { ModuleKey } from '../../routes/types';
import { useProfileAvatar } from '../perfil/profileAvatar';

type DashboardLayoutProps = {
  user: PublicUser;
  onLogout: () => void;
};

const ROLE_LABEL: Record<string, string> = {
  ADMIN: 'Administrador',
  RECEPTION: 'Recepcionista',
  CLEANING: 'Personal de limpieza'
};

// Primer módulo navegable al que el rol tiene acceso; evita aterrizar en una
// pantalla prohibida (el personal de limpieza entra directo a Habitaciones).
function getHomeModule(user: PublicUser | null): ModuleKey {
  if (!user) {
    return 'dashboard';
  }
  const firstAllowed = getAllowedRoutes(user.role as Role).find(
    (route) => route.meta.section === 'main' && route.meta.icon && !route.meta.isPublic
  );
  return (firstAllowed?.key as ModuleKey) ?? 'dashboard';
}

export function DashboardLayout({ user, onLogout }: DashboardLayoutProps): ReactElement {
  const { user: sessionUser } = useAuthSession();
  const resolvedUser = sessionUser ?? user ?? null;
  const [active, setActive] = useState<ModuleKey>(() => getHomeModule(resolvedUser));
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [avatar] = useProfileAvatar(resolvedUser?.id);
  const bp = useBreakpoint();
  const route = findRoute(active);
  const pageTitle = route?.meta.title ?? 'SAPAY';

  // Auto-colapsar sidebar cuando la ventana es angosta (< 1024px),
  // y restaurarlo cuando crece de vuelta.
  useEffect(() => {
    if (bp === 'compact') {
      setSidebarOpen(false);
    } else {
      setSidebarOpen(true);
    }
  }, [bp]);

  // El reloj debe avanzar solo; calcularlo en el render lo dejaba congelado
  // hasta que ocurriera otro re-render sin relación.
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

          <div className="hidden items-center gap-2 rounded-[16px] border border-sapay-350 bg-[#fbf8f4] px-3 py-1.5 text-sapay-900 shadow-[0_10px_24px_rgba(67,42,27,0.06)] lg:flex">
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

          <span className="hidden h-4 w-px bg-[hsl(var(--border))] lg:block" />
          <div className="relative">
            <button
              type="button"
              onClick={() => setProfileMenuOpen((open) => !open)}
              className="flex items-center gap-2 rounded-xl px-1.5 py-1 transition hover:bg-[#fff9f5]"
              aria-expanded={profileMenuOpen}
              aria-haspopup="menu"
            >
            <div className="hidden text-right lg:block">
              <p className="text-[11px] font-medium leading-tight">{resolvedUser?.fullName ?? 'Usuario'}</p>
              <p className="text-[9px] text-[hsl(var(--muted-foreground))]">
                {resolvedUser ? (ROLE_LABEL[resolvedUser.role] ?? 'Personal') : 'Personal'}
              </p>
            </div>
            <div className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-emerald-600 text-[10px] font-semibold text-white">
              {avatar ? <img src={avatar} alt="" className="h-full w-full object-cover" /> : (resolvedUser?.fullName ?? 'U').charAt(0)}
            </div>
            <ChevronDown size={13} className={`hidden text-sapay-700 transition-transform lg:block ${profileMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            {profileMenuOpen && (
              <div className="absolute right-0 top-10 z-50 w-44 rounded-xl border border-sapay-350 bg-white p-1.5 shadow-[0_14px_30px_rgba(67,42,27,0.15)]" role="menu">
                <button type="button" onClick={() => { setActive('perfil'); setProfileMenuOpen(false); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[11px] text-sapay-900 hover:bg-sapay-100" role="menuitem">
                  <UserRound size={14} /> Perfil
                </button>
                {resolvedUser?.role === Role.ADMIN && (
                  <button type="button" onClick={() => { setActive('config'); setProfileMenuOpen(false); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[11px] text-sapay-900 hover:bg-sapay-100" role="menuitem">
                    <Settings size={14} /> Configuración
                  </button>
                )}
                <div className="my-1 border-t border-sapay-200" />
                <button type="button" onClick={onLogout} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[11px] text-red-600 hover:bg-red-50" role="menuitem">
                  <LogOut size={14} /> Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </header>
        <div className="flex min-h-0 flex-1 flex-col bg-[hsl(var(--background))]">
          <RouteGuard
            activeModule={active}
            user={resolvedUser ?? undefined}
            onNavigateHome={() => setActive(getHomeModule(resolvedUser))}
          >
            {route
              ? createElement(route.component, {
                  user: resolvedUser ?? user,
                  onNavigate: setActive
                })
              : null}
          </RouteGuard>
          <AssistantChat user={resolvedUser ?? user} pageKey={active} pageTitle={pageTitle} />
        </div>
      </div>
    </div>
  );
}
