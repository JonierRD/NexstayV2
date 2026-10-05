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

// PROCESO: Total a liquidar en check-out = habitación + ventas fiado + lavandería.
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
    return sum + roomCost + fiadoSales + laundryCost;
  }, 0);
}

const ACTIVE_LAUNDRY_STATUSES = ['PENDIENTE', 'EN_PROCESO', 'LISTO'];

export function selectActiveLaundry(orders: Laundry[]): Laundry[] {
  return orders.filter((l) => ACTIVE_LAUNDRY_STATUSES.includes(l.status));
}

export type LaundryBadge = { bg: string; label: string };

export function getLaundryBadge(status: string): LaundryBadge {
  switch (status) {
    case 'LISTO':
      return { bg: 'bg-emerald-50 text-emerald-800 border-emerald-200', label: 'Listo para entrega' };
    case 'EN_PROCESO':
      return { bg: 'bg-sky-50 text-sky-800 border-sky-200', label: 'En lavado' };
    default:
      return { bg: 'bg-amber-50 text-amber-800 border-amber-200', label: 'Pendiente' };
  }
}