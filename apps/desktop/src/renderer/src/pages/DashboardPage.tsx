import {
  BadgePercent,
  BedDouble,
  Building2,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Package,
  RefreshCw,
  Shirt,
  Users,
  Wallet
} from 'lucide-react';
import { type ReactElement } from 'react';
import { type PublicUser } from '../lib/api';
import { formatCOP, formatDateTime } from '../lib/format';
import { Button } from '../components/ui/Button';
import { useDashboard } from '../components/dashboard/useDashboard';
import { getLaundryBadge } from '../components/dashboard/metrics';
import bedImage from '../assets/dashboard/cama.png';

type Props = { user: PublicUser };

function MetricCard({
  label,
  value,
  note,
  icon: Icon,
  accent = 'bg-sapay-150 text-sapay-800'
}: {
  label: string;
  value: string | number;
  note: string;
  icon: typeof BedDouble;
  accent?: string;
}): ReactElement {
  return (
    <article className="dashboard-card group relative overflow-hidden rounded-2xl border-2 border-sapay-500 bg-white p-3.5 shadow-md shadow-sapay-900/10 transition duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-sapay-900/15">
      <div className="pointer-events-none absolute -bottom-9 -right-8 h-28 w-28 rounded-full bg-sapay-100/80 transition-transform group-hover:scale-125" />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-sapay-700">{label}</p>
          <p className="mt-1.5 text-2xl font-black tracking-tight text-sapay-950">{value}</p>
        </div>
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl shadow-sm ${accent}`}>
          <Icon size={21} strokeWidth={2.3} />
        </span>
      </div>
      <p className="relative mt-3 truncate border-t border-sapay-200 pt-2.5 text-[11px] text-sapay-650">{note}</p>
    </article>
  );
}

export function DashboardPage({ user }: Props): ReactElement {
  const {
    isAdmin, loading, error, reload, activeStays, roomMetrics, guestsCount,
    todayCheckIns, todaySalesRevenue, pendingReceivable, lowStockItems,
    activeLaundry, recentGuests
  } = useDashboard(user);
  const { occupiedRooms, availableRooms, maintenanceRooms, occupancyRate } = roomMetrics;

  return (
    <div className="module-page flex h-full flex-col gap-4 overflow-y-auto pb-5">
      <header className="dashboard-hero relative isolate overflow-hidden rounded-2xl border border-sapay-700/50 text-white shadow-lg shadow-sapay-900/20" style={{ backgroundColor: 'hsl(var(--sapay-950-solid))' }}>
        <img
          src={bedImage}
          alt="Habitación del hotel"
          className="absolute inset-y-0 right-0 -z-20 h-full w-[52%] object-cover"
          style={{
            objectPosition: 'center 72%',
            filter: 'brightness(1.16) contrast(1.03)',
            WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 45%)',
            maskImage: 'linear-gradient(to right, transparent 0%, black 45%)'
          }}
        />
        <div className="absolute inset-0 -z-10" style={{ background: 'linear-gradient(90deg, hsl(var(--sapay-950-solid)) 0%, hsl(var(--sapay-950-solid) / 0.96) 48%, hsl(var(--sapay-950-solid) / 0.28) 100%)' }} />
        <div className="flex min-h-[108px] items-center gap-4 px-5 py-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-white shadow-sm">
            <Building2 size={24} strokeWidth={2.2} />
          </div>
          <div className="relative min-w-0">
            <h1 className="text-lg font-bold leading-tight text-white">Panel de control</h1>
            <p className="mt-1 text-[11px] text-white/85">Hola, {user.fullName} · Resumen en tiempo real del hotel.</p>
          </div>
        </div>
      </header>

      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-sapay-950">Resumen de hoy</h2>
          <p className="text-[11px] text-sapay-650">Indicadores principales del hotel</p>
        </div>
        <Button onClick={() => void reload()} disabled={loading} className="h-9 rounded-xl border border-sapay-350 bg-white px-3 text-xs text-sapay-900 shadow-sm hover:bg-sapay-100">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Actualizando…' : 'Actualizar'}
        </Button>
      </div>

      {error && <div className="rounded-xl border border-danger-200 bg-danger-100 px-4 py-3 text-xs text-[#a23b3b]">{error}</div>}

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Indicadores del hotel">
        <MetricCard label="Ocupación" value={`${occupancyRate}%`} note={`${occupiedRooms} ocupadas · ${availableRooms} disponibles · ${maintenanceRooms} en mantenimiento`} icon={BadgePercent} />
        {isAdmin ? (
          <MetricCard label="Huéspedes alojados" value={guestsCount} note="Personas actualmente en el hotel" icon={Users} accent="bg-sapay-200 text-sapay-900" />
        ) : (
          <MetricCard label="Habitaciones disponibles" value={availableRooms} note="Listas para asignación hoy" icon={BedDouble} accent="bg-sapay-200 text-sapay-900" />
        )}
        {isAdmin ? (
          <MetricCard label="Ventas de tienda hoy" value={formatCOP(todaySalesRevenue)} note="Ingresos de contado registrados" icon={CircleDollarSign} accent="bg-sapay-250 text-sapay-850" />
        ) : (
          <MetricCard label="Huéspedes" value={guestsCount} note={`Alojados en ${occupiedRooms} habitaciones`} icon={Users} accent="bg-sapay-200 text-sapay-900" />
        )}
        {isAdmin ? (
          <MetricCard label="Cuentas en hospedaje" value={formatCOP(pendingReceivable)} note="Pendiente por liquidar al check-out" icon={Wallet} accent="bg-sapay-250 text-sapay-850" />
        ) : (
          <MetricCard label="Check-ins de hoy" value={todayCheckIns} note="Llegadas registradas en el día" icon={CalendarDays} accent="bg-sapay-250 text-sapay-850" />
        )}
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2" aria-label="Alertas operativas">
        <article className="dashboard-card overflow-hidden rounded-2xl border-2 border-sapay-500 bg-white shadow-md shadow-sapay-900/10">
          <div className="flex items-center justify-between gap-3 bg-sapay-900 px-4 py-3 text-white">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15"><Package size={21} /></span>
              <div><h2 className="text-sm font-bold">Stock bajo en tienda</h2><p className="text-[10px] text-white/75">Productos en el mínimo o por debajo</p></div>
            </div>
            <span className="rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold">{lowStockItems.length} alerta{lowStockItems.length === 1 ? '' : 's'}</span>
          </div>
          <div className="relative min-h-[106px] p-3.5">
            {lowStockItems.length === 0 ? (
              <div className="flex min-h-[76px] items-center gap-3 rounded-xl bg-sapay-50 px-4 pr-24 text-xs text-sapay-800">
                <CheckCircle2 size={20} className="shrink-0 text-sapay-700" />
                <span>Inventario al día. No hay productos por debajo del stock mínimo.</span>
              </div>
            ) : (
              <div className="max-h-[190px] space-y-2 overflow-y-auto pr-1">
                {lowStockItems.map((item) => <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl border border-sapay-250 bg-sapay-50 px-3 py-2 text-xs"><div className="min-w-0"><p className="truncate font-semibold text-sapay-950">{item.product.name}</p><p className="text-[10px] text-sapay-650">Mínimo: {item.minStock}</p></div><span className="shrink-0 rounded-lg bg-sapay-200 px-2 py-1 font-bold text-sapay-900">{item.quantity} disponibles</span></div>)}
              </div>
            )}
          </div>
        </article>

        <article className="dashboard-card overflow-hidden rounded-2xl border-2 border-sapay-500 bg-white shadow-md shadow-sapay-900/10">
          <div className="flex items-center justify-between gap-3 bg-sapay-900 px-4 py-3 text-white">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15"><Shirt size={21} /></span>
              <div><h2 className="text-sm font-bold">Lavandería activa</h2><p className="text-[10px] text-white/75">Servicios pendientes de entrega</p></div>
            </div>
            <span className="rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold">{activeLaundry.length} pedido{activeLaundry.length === 1 ? '' : 's'}</span>
          </div>
          <div className="relative min-h-[106px] p-3.5">
            {activeLaundry.length === 0 ? (
              <div className="flex min-h-[76px] items-center gap-3 rounded-xl bg-sapay-50 px-4 pr-28 text-xs text-sapay-800">
                <CheckCircle2 size={20} className="shrink-0 text-sapay-700" />
                <span>No hay prendas pendientes de entrega.</span>
              </div>
            ) : (
              <div className="relative z-10 max-h-[190px] space-y-2 overflow-y-auto pr-1">
                {activeLaundry.map((order) => {
                  const badge = getLaundryBadge(order.status);
                  return <div key={order.id} className="flex items-center justify-between gap-3 rounded-xl border border-sapay-250 bg-sapay-50/95 px-3 py-2 text-xs"><div className="min-w-0"><p className="truncate font-semibold text-sapay-950">{order.quantity}x {order.item}{order.description ? ` (${order.description})` : ''}</p><p className="truncate text-[10px] text-sapay-650">{order.roomNumber ? `Hab. ${order.roomNumber} · ` : ''}{order.clientName}</p></div><span className={`shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-bold ${badge.bg}`}>{badge.label}</span></div>;
                })}
              </div>
            )}
          </div>
        </article>
      </section>

      <section className="dashboard-card overflow-hidden rounded-2xl border-2 border-sapay-500 bg-white shadow-md shadow-sapay-900/10">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-sapay-200 px-4 py-3.5 sm:px-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sapay-150 text-sapay-850"><Users size={20} /></span>
            <div><h2 className="text-sm font-bold text-sapay-950">Llegadas recientes</h2><p className="text-[10px] text-sapay-650">Últimos huéspedes con estancia activa</p></div>
          </div>
          <span className="rounded-full bg-sapay-100 px-3 py-1 text-[10px] font-semibold text-sapay-750">{recentGuests.length} de {activeStays.length} huéspedes</span>
        </div>

        {recentGuests.length === 0 ? (
          <div className="relative flex min-h-[170px] flex-col items-center justify-center overflow-hidden bg-sapay-50 px-5 py-7 text-center">
            <img src={bedImage} alt="" className="absolute inset-0 h-full w-full object-cover opacity-[0.12]" />
            <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-sapay-800 shadow-sm"><BedDouble size={24} /></div>
            <p className="relative mt-3 text-sm font-semibold text-sapay-900">No hay huéspedes en estancia activa</p>
            <p className="relative mt-1 text-xs text-sapay-650">Las nuevas llegadas aparecerán aquí.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-xs">
              <thead><tr className="bg-sapay-50 text-[10px] font-bold uppercase tracking-wider text-sapay-700"><th className="px-4 py-3">Huésped</th><th className="px-3 py-3">Cédula</th><th className="px-3 py-3 text-center">Habitación</th><th className="px-3 py-3">Ingreso</th><th className="px-3 py-3 text-center">Noches</th><th className="px-3 py-3">Tipo</th><th className="px-4 py-3 text-right">Estado</th></tr></thead>
              <tbody className="divide-y divide-sapay-100">
                {recentGuests.map((stay) => <tr key={stay.id} className="transition-colors hover:bg-sapay-50/70">
                  <td className="px-4 py-3 font-semibold text-sapay-950">{stay.client ? `${stay.client.firstName} ${stay.client.lastName}` : 'Sin nombre'}</td>
                  <td className="px-3 py-3 font-mono text-[10px] text-sapay-700">{stay.client?.cc ?? '—'}</td>
                  <td className="px-3 py-3 text-center"><span className="rounded-lg border border-sapay-300 bg-sapay-50 px-2.5 py-1 font-bold text-sapay-900">{stay.roomNumber}</span></td>
                  <td className="px-3 py-3 text-sapay-750"><span className="inline-flex items-center gap-1.5"><Clock3 size={13} className="text-sapay-600" />{formatDateTime(stay.checkIn)}</span></td>
                  <td className="px-3 py-3 text-center font-semibold text-sapay-900">{stay.nights}</td>
                  <td className="px-3 py-3 text-sapay-750">{stay.acTypeUsed === 'AIRE' ? 'Aire' : 'Ventilador'}</td>
                  <td className="px-4 py-3 text-right"><span className="inline-flex items-center gap-1 rounded-full bg-sapay-100 px-2.5 py-1 text-[10px] font-semibold text-sapay-800"><CheckCircle2 size={12} />En estancia</span></td>
                </tr>)}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
