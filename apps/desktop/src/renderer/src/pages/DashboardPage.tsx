import {
  AlertTriangle,
  BadgePercent,
  BedDouble,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock,
  DollarSign,
  Package,
  RefreshCw,
  Shirt,
  UserCheck,
  Users,
  Wallet
} from 'lucide-react';
import { type ReactElement, useCallback, useEffect, useState } from 'react';
import { type PublicUser } from '../lib/api';
import { type Habitacion, habitacionesRequest } from '../lib/api/habitaciones';
import { type StockItem, type StaySale, inventoryRequest, salesRequest } from '../lib/api/inventory';
import { type Laundry, laundryRequest } from '../lib/api/laundry';
import { type Stay, staysActiveRequest } from '../lib/api/stays';
import { formatCOP, formatDateTime, formatDateShort } from '../lib/format';
import { Button } from '../components/ui/button';

type Props = {
  user: PublicUser;
};

export function DashboardPage({ user }: Props): ReactElement {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [rooms, setRooms] = useState<Habitacion[]>([]);
  const [activeStays, setActiveStays] = useState<Stay[]>([]);
  const [inventory, setInventory] = useState<StockItem[]>([]);
  const [laundryOrders, setLaundryOrders] = useState<Laundry[]>([]);
  const [sales, setSales] = useState<StaySale[]>([]);

  const isAdmin = user?.role === 'ADMIN';

  const isToday = (dateString?: string | Date | null): boolean => {
    if (!dateString) return false;
    const d = new Date(dateString);
    const now = new Date();
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    );
  };

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [roomsData, staysData, invData, laundryData] = await Promise.all([
        habitacionesRequest().catch(() => [] as Habitacion[]),
        staysActiveRequest().catch(() => [] as Stay[]),
        inventoryRequest().catch(() => [] as StockItem[]),
        laundryRequest().catch(() => [] as Laundry[])
      ]);

      setRooms(roomsData);
      setActiveStays(staysData);
      setInventory(invData);
      setLaundryOrders(laundryData);

      if (isAdmin) {
        try {
          const salesData = await salesRequest();
          setSales(salesData);
        } catch {
          setSales([]);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar los datos del dashboard');
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    void loadDashboardData();
  }, [loadDashboardData]);

  // Cálculos de métricas
  const totalRooms = rooms.length;
  const occupiedRooms = rooms.filter((r) => r.status === 'OCUPADA').length;
  const availableRooms = rooms.filter((r) => r.status === 'DISPONIBLE').length;
  const maintenanceRooms = rooms.filter(
    (r) => r.status === 'MANTENIMIENTO' || r.status === 'RESERVADA'
  ).length;

  const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;
  const guestsCount = activeStays.length;

  const todayCheckIns = activeStays.filter((stay) => isToday(stay.checkIn)).length;

  // Cálculos financieros (solo para ADMIN)
  const todaySalesRevenue = sales
    .filter((s) => isToday(s.date) && s.saleType === 'CONTADO')
    .reduce((sum, s) => sum + (Number(s.unitPrice) || 0) * s.quantity, 0);

  const pendingReceivable = activeStays.reduce((sum, stay) => {
    const roomCost = Number(stay.total) || 0;
    const fiadoSales = (stay.sales || [])
      .filter((s) => s.saleType === 'FIADO' || !s.saleType)
      .reduce((sSum, s) => sSum + (Number(s.unitPrice) || 0) * s.quantity, 0);
    const laundryCost = (stay.laundry || []).reduce(
      (lSum, l) => lSum + (Number(l.totalPrice) || 0),
      0
    );
    return sum + roomCost + fiadoSales + laundryCost;
  }, 0);

  // Alertas
  const lowStockItems = inventory.filter((item) => item.quantity <= item.minStock);
  const activeLaundry = laundryOrders.filter((l) =>
    ['PENDIENTE', 'EN_PROCESO', 'LISTO'].includes(l.status)
  );

  // Últimos huéspedes registrados (ordenados por checkIn descendente)
  const recentGuests = [...activeStays]
    .sort((a, b) => new Date(b.checkIn).getTime() - new Date(a.checkIn).getTime())
    .slice(0, 5);

  const getLaundryBadge = (status: string) => {
    switch (status) {
      case 'LISTO':
        return {
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          label: 'Listo para entrega'
        };
      case 'EN_PROCESO':
        return {
          bg: 'bg-sky-50 text-sky-800 border-sky-200',
          label: 'En lavado'
        };
      default:
        return {
          bg: 'bg-amber-50 text-amber-800 border-amber-200',
          label: 'Pendiente'
        };
    }
  };

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-4">
      {/* Encabezado */}
      <div className="flex flex-col gap-3 rounded-2xl border border-sapay-350 bg-white p-4 shadow-[0_12px_28px_rgba(52,39,28,0.04)] sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f7efe8] text-sapay-950">
            <Building2 size={22} />
          </div>
          <div>
            <h1 className="text-[18px] font-bold text-sapay-950">Dashboard Operativo</h1>
            <p className="text-[11px] text-sapay-750">
              Resumen en tiempo real del estado del hotel, alertas activas y ocupación.
            </p>
          </div>
        </div>

        <Button
          onClick={() => void loadDashboardData()}
          disabled={loading}
          className="h-8 self-start sm:self-auto rounded-xl border border-sapay-450 bg-white px-3 text-[11px] font-semibold text-sapay-900 transition hover:bg-sapay-100"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Actualizando...' : 'Actualizar datos'}
        </Button>
      </div>

      {error && (
        <div className="rounded-xl border border-danger-200 bg-danger-100 px-3.5 py-2.5 text-[11px] text-[#a23b3b]">
          {error}
        </div>
      )}

      {/* ── 1. Indicadores Clave (KPIs en Tarjetas Compactas) ── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {/* Card 1: Tasa de Ocupación */}
        <div className="flex flex-col justify-between rounded-2xl border border-sapay-350 bg-white p-3.5 shadow-[0_10px_24px_rgba(52,39,28,0.04)]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-sapay-750">
              Ocupación
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800">
              <BadgePercent size={15} />
            </div>
          </div>
          <div className="my-1.5">
            <div className="flex items-baseline gap-1.5">
              <span className="text-[22px] font-black tracking-tight text-sapay-950">
                {occupancyRate}%
              </span>
              <span className="text-[11px] text-sapay-650 font-medium">del total</span>
            </div>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-sapay-100">
              <div
                className="h-full rounded-full bg-emerald-600 transition-all duration-500"
                style={{ width: `${Math.min(100, occupancyRate)}%` }}
              />
            </div>
          </div>
          <p className="text-[10px] text-sapay-650 truncate">
            {occupiedRooms} ocupadas · {availableRooms} libres · {maintenanceRooms} mant.
          </p>
        </div>

        {/* Card 2: Habitaciones Disponibles (Recepción) / Huéspedes Alojados (Admin) */}
        {!isAdmin ? (
          <div className="flex flex-col justify-between rounded-2xl border border-sapay-350 bg-white p-3.5 shadow-[0_10px_24px_rgba(52,39,28,0.04)]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-sapay-750">
                Disponibles
              </span>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#f4ece4] text-[#865934]">
                <BedDouble size={15} />
              </div>
            </div>
            <div className="my-1.5">
              <span className="text-[22px] font-black tracking-tight text-sapay-950">
                {availableRooms}
              </span>
            </div>
            <p className="text-[10px] text-sapay-650 truncate">
              Listas para venta y asignación hoy
            </p>
          </div>
        ) : (
          <div className="flex flex-col justify-between rounded-2xl border border-sapay-350 bg-white p-3.5 shadow-[0_10px_24px_rgba(52,39,28,0.04)]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-sapay-750">
                Huéspedes
              </span>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-50 text-sky-800">
                <Users size={15} />
              </div>
            </div>
            <div className="my-1.5">
              <span className="text-[22px] font-black tracking-tight text-sapay-950">
                {guestsCount}
              </span>
            </div>
            <p className="text-[10px] text-sapay-650 truncate">
              Personas alojadas actualmente
            </p>
          </div>
        )}

        {/* Card 3: Huéspedes (Recepción) / Ingresos de Hoy (Admin) */}
        {!isAdmin ? (
          <div className="flex flex-col justify-between rounded-2xl border border-sapay-350 bg-white p-3.5 shadow-[0_10px_24px_rgba(52,39,28,0.04)]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-sapay-750">
                Huéspedes
              </span>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-50 text-sky-800">
                <Users size={15} />
              </div>
            </div>
            <div className="my-1.5">
              <span className="text-[22px] font-black tracking-tight text-sapay-950">
                {guestsCount}
              </span>
            </div>
            <p className="text-[10px] text-sapay-650 truncate">
              En {occupiedRooms} habitaciones activas
            </p>
          </div>
        ) : (
          <div className="flex flex-col justify-between rounded-2xl border border-sapay-350 bg-white p-3.5 shadow-[0_10px_24px_rgba(52,39,28,0.04)]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-sapay-750">
                Ventas Tienda Hoy
              </span>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800">
                <DollarSign size={15} />
              </div>
            </div>
            <div className="my-1.5">
              <span className="text-[20px] font-black tracking-tight text-sapay-950">
                {formatCOP(todaySalesRevenue)}
              </span>
            </div>
            <p className="text-[10px] text-sapay-650 truncate">
              Ingresos de contado en tienda
            </p>
          </div>
        )}

        {/* Card 4: Llegadas de Hoy (Recepción) / Cuentas por Cobrar (Admin) */}
        {!isAdmin ? (
          <div className="flex flex-col justify-between rounded-2xl border border-sapay-350 bg-white p-3.5 shadow-[0_10px_24px_rgba(52,39,28,0.04)]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-sapay-750">
                Check-ins Hoy
              </span>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-50 text-purple-800">
                <CalendarDays size={15} />
              </div>
            </div>
            <div className="my-1.5">
              <span className="text-[22px] font-black tracking-tight text-sapay-950">
                {todayCheckIns}
              </span>
            </div>
            <p className="text-[10px] text-sapay-650 truncate">
              Llegadas registradas en el día
            </p>
          </div>
        ) : (
          <div className="flex flex-col justify-between rounded-2xl border border-sapay-350 bg-white p-3.5 shadow-[0_10px_24px_rgba(52,39,28,0.04)]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-sapay-750">
                Cuentas en Hospedaje
              </span>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-800">
                <Wallet size={15} />
              </div>
            </div>
            <div className="my-1.5">
              <span className="text-[20px] font-black tracking-tight text-sapay-950">
                {formatCOP(pendingReceivable)}
              </span>
            </div>
            <p className="text-[10px] text-sapay-650 truncate">
              Pendiente por liquidar al check-out
            </p>
          </div>
        )}
      </div>

      {/* ── 2. Alertas Operativas en Tiempo Real (2 columnas) ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Panel 1: Stock Bajo en Tienda */}
        <section className="rounded-2xl border border-sapay-350 bg-white p-4 shadow-[0_12px_28px_rgba(52,39,28,0.04)]">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-800">
                <AlertTriangle size={15} />
              </div>
              <div>
                <h2 className="text-[13px] font-bold text-sapay-950">Stock Bajo en Tienda</h2>
                <p className="text-[10px] text-sapay-750">Artículos con existencia igual o inferior al mínimo</p>
              </div>
            </div>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                lowStockItems.length > 0
                  ? 'bg-amber-100 text-amber-900'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {lowStockItems.length} alerta{lowStockItems.length === 1 ? '' : 's'}
            </span>
          </div>

          {lowStockItems.length === 0 ? (
            <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5 text-[11px] text-emerald-900">
              <CheckCircle2 size={16} className="text-emerald-700 shrink-0" />
              <span>Inventario al día. Ningún producto está por debajo del stock mínimo.</span>
            </div>
          ) : (
            <div
              className="max-h-[220px] space-y-2 overflow-y-auto pr-1"
              style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(0,0,0,0.18) transparent' }}
            >
              {lowStockItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-sapay-350 bg-sapay-50 p-2.5 text-[11px]"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sapay-950 truncate">{item.product.name}</p>
                    <p className="text-[10px] text-sapay-650">
                      Precio: {formatCOP(Number(item.product.price))}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="rounded-md border border-amber-300 bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                      {item.quantity} disponibles
                    </span>
                    <span className="text-[10px] text-sapay-600">
                      Mín: {item.minStock}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Panel 2: Estado de Lavandería */}
        <section className="rounded-2xl border border-sapay-350 bg-white p-4 shadow-[0_12px_28px_rgba(52,39,28,0.04)]">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-100 text-sky-800">
                <Shirt size={15} />
              </div>
              <div>
                <h2 className="text-[13px] font-bold text-sapay-950">Lavandería Activa</h2>
                <p className="text-[10px] text-sapay-750">Servicios pendientes, en lavado o listos para entrega</p>
              </div>
            </div>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                activeLaundry.length > 0
                  ? 'bg-sky-100 text-sky-900'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {activeLaundry.length} pedido{activeLaundry.length === 1 ? '' : 's'}
            </span>
          </div>

          {activeLaundry.length === 0 ? (
            <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5 text-[11px] text-emerald-900">
              <CheckCircle2 size={16} className="text-emerald-700 shrink-0" />
              <span>No hay prendas pendientes ni en proceso en el área de lavandería.</span>
            </div>
          ) : (
            <div
              className="max-h-[220px] space-y-2 overflow-y-auto pr-1"
              style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(0,0,0,0.18) transparent' }}
            >
              {activeLaundry.map((order) => {
                const badge = getLaundryBadge(order.status);
                return (
                  <div
                    key={order.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-sapay-350 bg-sapay-50 p-2.5 text-[11px]"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sapay-950 truncate">
                        {order.quantity}x {order.item}
                        {order.description ? ` (${order.description})` : ''}
                      </p>
                      <p className="text-[10px] text-sapay-650">
                        {order.roomNumber ? `Hab. ${order.roomNumber} · ` : ''}
                        {order.clientName}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-bold ${badge.bg}`}
                    >
                      {badge.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* ── 3. Últimos Huéspedes Registrados ── */}
      <section className="rounded-2xl border border-sapay-350 bg-white p-4 shadow-[0_12px_28px_rgba(52,39,28,0.04)]">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
              <UserCheck size={15} />
            </div>
            <div>
              <h2 className="text-[13px] font-bold text-sapay-950">Llegadas Recientes</h2>
              <p className="text-[10px] text-sapay-750">
                Últimos huéspedes ingresados al sistema con estancia activa
              </p>
            </div>
          </div>
          <span className="text-[11px] font-medium text-sapay-650">
            {recentGuests.length} de {activeStays.length} registrados
          </span>
        </div>

        {recentGuests.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#d8c7bb] bg-sapay-50 p-8 text-center text-[11px] text-sapay-750">
            No hay huéspedes en estancia activa en este momento.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px]">
              <thead>
                <tr className="border-b border-sapay-200 text-[10px] font-bold uppercase tracking-[0.06em] text-sapay-750">
                  <th className="pb-2 pl-2">Huésped</th>
                  <th className="pb-2">Cédula</th>
                  <th className="pb-2 text-center">Habitación</th>
                  <th className="pb-2">Ingreso</th>
                  <th className="pb-2 text-center">Noches</th>
                  <th className="pb-2 text-center">Clima</th>
                  <th className="pb-2 pr-2 text-right">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sapay-100">
                {recentGuests.map((stay) => {
                  const clientName = stay.client
                    ? `${stay.client.firstName} ${stay.client.lastName}`
                    : 'Sin nombre';
                  const clientCc = stay.client?.cc ?? '—';

                  return (
                    <tr key={stay.id} className="hover:bg-sapay-50 transition-colors">
                      <td className="py-2.5 pl-2 font-semibold text-sapay-950">
                        {clientName}
                      </td>
                      <td className="py-2.5 text-sapay-750 font-mono text-[10px]">
                        {clientCc}
                      </td>
                      <td className="py-2.5 text-center">
                        <span className="rounded-md border border-sapay-350 bg-white px-2 py-0.5 font-bold text-sapay-950">
                          {stay.roomNumber}
                        </span>
                      </td>
                      <td className="py-2.5 text-sapay-800">
                        {formatDateTime(stay.checkIn)}
                      </td>
                      <td className="py-2.5 text-center font-medium text-sapay-900">
                        {stay.nights}
                      </td>
                      <td className="py-2.5 text-center">
                        <span
                          className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                            stay.acTypeUsed === 'AIRE'
                              ? 'bg-sky-50 text-sky-800'
                              : 'bg-stone-100 text-stone-700'
                          }`}
                        >
                          {stay.acTypeUsed === 'AIRE' ? 'Aire' : 'Ventilador'}
                        </span>
                      </td>
                      <td className="py-2.5 pr-2 text-right">
                        <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                          En estancia
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
