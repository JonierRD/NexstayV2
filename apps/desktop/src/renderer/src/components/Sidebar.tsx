import {
  LayoutDashboard,
  Users,
  BedDouble,
  ShoppingCart,
  Car,
  Droplets,
  DollarSign,
  CalendarDays,
  Wind,
  Candy,
  FileText,
  UserCircle,
  Settings,
  LogOut,
  PanelLeftClose,
  ConciergeBell,
  CalendarCheck,
  UserCheck,
  ClipboardList,
  Shirt,
  Package,
  type LucideIcon
} from 'lucide-react';
import Logo from '../assets/login/Logo.png';
import { cn } from '../lib/utils';

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
  | 'config';

type NavItem = {
  key: ModuleKey;
  label: string;
  icon: LucideIcon;
};

const mainModules: NavItem[] = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'recepcion', label: 'Recepción', icon: ConciergeBell },
  { key: 'reservas', label: 'Reservas', icon: CalendarCheck },
  { key: 'huespedes', label: 'Huéspedes', icon: UserCheck },
  { key: 'habitaciones', label: 'Habitaciones', icon: BedDouble },
  { key: 'clientes', label: 'Clientes', icon: Users },
  { key: 'ventas', label: 'Ventas', icon: ShoppingCart },
  { key: 'parqueadero', label: 'Parqueadero', icon: Car },
  { key: 'lavanderia', label: 'Lavandería', icon: Shirt },
  { key: 'inventario', label: 'Inventario', icon: Package },
  { key: 'auditoria', label: 'Auditoría', icon: ClipboardList }
];

const futureModules: NavItem[] = [
  { key: 'lavado', label: 'Lavado tanque', icon: Droplets },
  { key: 'ingresos-gastos', label: 'Ingresos y Gastos', icon: DollarSign },
  { key: 'semanario', label: 'Semanario', icon: CalendarDays },
  { key: 'aires', label: 'Aires', icon: Wind },
  { key: 'mecato', label: 'Mecato', icon: Candy },
  { key: 'facturas', label: 'Facturas', icon: FileText }
];

const bottomItems: NavItem[] = [
  { key: 'perfil', label: 'Perfil', icon: UserCircle },
  { key: 'config', label: 'Configuración', icon: Settings }
];

type SidebarProps = {
  active: ModuleKey;
  onNavigate: (key: ModuleKey) => void;
  onLogout: () => void;
  open: boolean;
  onToggle: () => void;
};

export function Sidebar({ active, onNavigate, onLogout, open, onToggle }: SidebarProps) {
  if (!open) return null;

  return (
    <aside className="flex h-full w-52 flex-col bg-gradient-to-b from-[#30221a] to-[#190b00] text-[#f7efe8] shadow-[4px_0_20px_rgba(0,0,0,0.3)]">
      <div className="border-b border-white/10 px-3 py-3">
        <div className="relative">
          <img src={Logo} alt="SAPAY" className="mx-auto h-40 w-40 rounded-full bg-white object-contain p-2" />
          <button
            onClick={onToggle}
            className="absolute -right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-white/60 hover:bg-white/20 hover:text-white transition-colors"
            title="Ocultar menú"
          >
            <PanelLeftClose size={12} />
          </button>
        </div>
      </div>

      <nav className="flex-1 overflow-hidden px-2 py-2 space-y-0.5">
        <p className="px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest text-white/60">
          Principal
        </p>
        {mainModules.map((item) => (
          <button
            key={item.key}
            onClick={() => onNavigate(item.key)}
            className={cn(
              'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[11px] font-semibold transition-colors',
              active === item.key
                ? 'bg-[#f3c34a]/20 text-[#f3c34a]'
                : 'text-white/85 hover:bg-white/10 hover:text-white'
            )}
          >
            <item.icon size={14} />
            <span>{item.label}</span>
          </button>
        ))}

        <p className="mt-2 px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest text-white/60">
          Más módulos
        </p>
        {futureModules.map((item) => (
          <button
            key={item.key}
            onClick={() => onNavigate(item.key)}
            className={cn(
              'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[11px] font-semibold transition-colors',
              active === item.key
                ? 'bg-[#f3c34a]/20 text-[#f3c34a]'
                : 'text-white/70 hover:bg-white/10 hover:text-white'
            )}
          >
            <item.icon size={14} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="border-t border-white/10 px-2 py-1.5 space-y-0.5">
        {bottomItems.map((item) => (
          <button
            key={item.key}
            onClick={() => onNavigate(item.key)}
            className={cn(
              'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[11px] font-semibold transition-colors',
              active === item.key
                ? 'bg-[#f3c34a]/20 text-[#f3c34a]'
                : 'text-white/85 hover:bg-white/10 hover:text-white'
            )}
          >
            <item.icon size={14} />
            <span>{item.label}</span>
          </button>
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
