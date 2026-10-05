import { LogOut, PanelLeftClose, type LucideIcon } from 'lucide-react';
import Logo from '../../assets/login/Logo.png';
import { cn } from '../../lib/utils';
import type { PublicUser } from '../../lib/api';
import { usePermissions } from '../../security';
import { moduleRoutes } from '../../routes/moduleRoutes';
import type { ModuleKey } from '../../routes/types';

type NavItem = {
  key: ModuleKey;
  label: string;
  icon: LucideIcon;
};

// Se derivan dinámicamente de la única fuente de verdad: moduleRoutes
const mainModules: NavItem[] = moduleRoutes
  .filter((r) => r.meta.section === 'main' && r.meta.icon)
  .map((r) => ({ key: r.key, label: r.meta.title, icon: r.meta.icon! }));

const futureModules: NavItem[] = moduleRoutes
  .filter((r) => r.meta.section === 'future' && r.meta.icon)
  .map((r) => ({ key: r.key, label: r.meta.title, icon: r.meta.icon! }));

const bottomItems: NavItem[] = moduleRoutes
  .filter((r) => r.meta.section === 'bottom' && r.meta.icon)
  .map((r) => ({ key: r.key, label: r.meta.title, icon: r.meta.icon! }));

type SidebarProps = {
  active: ModuleKey;
  onNavigate: (key: ModuleKey) => void;
  onLogout: () => void;
  open: boolean;
  onToggle: () => void;
  user?: PublicUser | null;
};

function NavButton({
  item,
  active,
  onNavigate,
  dimmed = false
}: {
  item: NavItem;
  active: ModuleKey;
  onNavigate: (key: ModuleKey) => void;
  dimmed?: boolean;
}) {
  return (
    <button
      onClick={() => onNavigate(item.key)}
      className={cn(
        'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[11px] font-semibold transition-colors',
        active === item.key
          ? 'bg-[#f3c34a]/20 text-[#f3c34a]'
          : dimmed
            ? 'text-white/70 hover:bg-white/10 hover:text-white'
            : 'text-white/85 hover:bg-white/10 hover:text-white'
      )}
    >
      <item.icon size={14} />
      <span>{item.label}</span>
    </button>
  );
}

export function Sidebar({ active, onNavigate, onLogout, open, onToggle, user }: SidebarProps) {
  const { canAccess } = usePermissions({ user });

  if (!open) return null;

  // Filtrado de módulos según permisos del rol activo (Capa 5: v-can / defensa en profundidad)
  const visibleMainModules = mainModules.filter((item) => canAccess(item.key));
  const visibleFutureModules = futureModules.filter((item) => canAccess(item.key));
  const visibleBottomItems = bottomItems.filter((item) => canAccess(item.key));

  return (
    <aside className="flex h-full w-52 flex-col bg-gradient-to-b from-[#30221a] to-[#190b00] text-[#f7efe8] shadow-[4px_0_20px_rgba(0,0,0,0.3)]">
      <div className="border-b border-white/10 px-3 py-2">
        <div className="relative">
          <img src={Logo} alt="SAPAY" className="mx-auto h-20 w-20 rounded-full bg-white object-contain p-1.5 shadow-sm" />
          <button
            onClick={onToggle}
            className="absolute -right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-white/60 hover:bg-white/20 hover:text-white transition-colors"
            title="Ocultar menú"
          >
            <PanelLeftClose size={12} />
          </button>
        </div>
      </div>

      <nav
        className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5"
        style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.2) transparent' }}
      >
        <p className="px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest text-white/60">
          Principal
        </p>
        {visibleMainModules.map((item) => (
          <NavButton key={item.key} item={item} active={active} onNavigate={onNavigate} />
        ))}

        {visibleFutureModules.length > 0 && (
          <>
            <p className="mt-2 px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest text-white/60">
              Más módulos
            </p>
            {visibleFutureModules.map((item) => (
              <NavButton
                key={item.key}
                item={item}
                active={active}
                onNavigate={onNavigate}
                dimmed
              />
            ))}
          </>
        )}
      </nav>

      <div className="border-t border-white/10 px-2 py-1.5 space-y-0.5">
        {visibleBottomItems.map((item) => (
          <NavButton key={item.key} item={item} active={active} onNavigate={onNavigate} />
        ))}
        <button
          onClick={onLogout}
          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[11px] font-semibold text-red-300 hover:bg-red-900/30 transition-colors"
        >
          <LogOut size={14} />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  );
}
