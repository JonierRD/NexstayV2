import { type Laundry } from '../../lib/api/laundry';
import { type StaySale } from '../../lib/api/inventory';
import { type Habitacion } from '../../lib/api/habitaciones';
import { type Stay } from '../../lib/api/stays';

export function isToday(dateString?: string | Date | null): boolean {
  if (!dateString) return false;
  const d = new Date(dateString);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export type RoomMetrics = {
  totalRooms: number;
  occupiedRooms: number;
  availableRooms: number;
  maintenanceRooms: number;
  occupancyRate: number;
};

export function computeRoomMetrics(rooms: Habitacion[]): RoomMetrics {
  const totalRooms = rooms.length;
  const occupiedRooms = rooms.filter((r) => r.status === 'OCUPADA').length;
  const availableRooms = rooms.filter((r) => r.status === 'DISPONIBLE').length;
  const maintenanceRooms = rooms.filter(
    (r) => r.status === 'MANTENIMIENTO' || r.status === 'RESERVADA'
  ).length;

  return {
    totalRooms,
    occupiedRooms,
    availableRooms,
    maintenanceRooms,
    occupancyRate: totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0
  };
}

// PROCESO: Solo las ventas de contado del día ingresan a las cajas del día.
export function computeTodaySalesRevenue(sales: StaySale[]): number {
  return sales
    .filter((s) => isToday(s.date) && s.saleType === 'CONTADO')
    .reduce((sum, s) => sum + (Number(s.unitPrice) || 0) * s.quantity, 0);
}

// PROCESO: Total a liquidar en check-out = habitación + ventas fiado + lavandería,
// menos el anticipo de la reserva y los pagos parciales ya registrados.
export function computePendingReceivable(stays: Stay[]): number {
  return stays.reduce((sum, stay) => {
    const roomCost = Number(stay.total) || 0;
    const fiadoSales = (stay.sales || [])
      .filter((s) => s.saleType === 'FIADO' || !s.saleType)
      .reduce((sSum, s) => sSum + (Number(s.unitPrice) || 0) * s.quantity, 0);
    const laundryCost = (stay.laundry || []).reduce(
      (lSum, l) => lSum + (Number(l.totalPrice) || 0),
      0
    );
    const reservationPaid = (stay.reservation?.payments ?? []).reduce(
      (pSum, p) => pSum + (p.type === 'PAGO' ? Number(p.amount) : -Number(p.amount)),
      0
    );
    const reservationCredit = Math.min(roomCost, Math.max(0, reservationPaid));
    const priorPayments = (stay.payments ?? []).reduce(
      (pSum, p) => pSum + Number(p.amount),
      0
    );
    const balance = Math.max(0, roomCost + fiadoSales + laundryCost - reservationCredit - priorPayments);
    return sum + balance;
  }, 0);
}

export function selectActiveLaundry(orders: Laundry[]): Laundry[] {
  return orders.filter((l) => l.status !== 'ENTREGADO');
}

export type LaundryBadge = { bg: string; label: string };

export function getLaundryBadge(status: string): LaundryBadge {
  return status === 'ENTREGADO'
    ? { bg: 'bg-emerald-50 text-emerald-800 border-emerald-200', label: 'Entregado' }
    : { bg: 'bg-amber-50 text-amber-800 border-amber-200', label: 'Pendiente' };
}