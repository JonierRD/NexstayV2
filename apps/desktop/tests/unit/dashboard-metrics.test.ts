import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  computePendingReceivable,
  computeRoomMetrics,
  computeTodaySalesRevenue,
  getLaundryBadge,
  isToday,
  selectActiveLaundry
} from '@/components/dashboard/metrics';
import { makeLaundry, makeRoom, makeSale, makeStay } from '../helpers/fixtures';

describe('U2 - components/dashboard/metrics.ts', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('computeRoomMetrics cuenta total, ocupadas, disponibles y mantenimiento/reservadas', () => {
    const rooms = [
      makeRoom({ status: 'OCUPADA' }),
      makeRoom({ status: 'DISPONIBLE' }),
      makeRoom({ status: 'MANTENIMIENTO' }),
      makeRoom({ status: 'RESERVADA' })
    ];

    expect(computeRoomMetrics(rooms)).toEqual({
      totalRooms: 4,
      occupiedRooms: 1,
      availableRooms: 1,
      maintenanceRooms: 2,
      occupancyRate: 25
    });
  });

  it('computeRoomMetrics devuelve 0% de ocupacion cuando no hay habitaciones', () => {
    expect(computeRoomMetrics([]).occupancyRate).toBe(0);
  });

  it('isToday reconoce la fecha de hoy y rechaza ayer/manana', () => {
    vi.setSystemTime(new Date('2026-10-19T15:00:00.000Z'));

    expect(isToday('2026-10-19T10:00:00.000Z')).toBe(true);
    expect(isToday('2026-10-18T10:00:00.000Z')).toBe(false);
    expect(isToday('2026-10-20T10:00:00.000Z')).toBe(false);
  });

  it('computeTodaySalesRevenue suma solo ventas CONTADO del dia', () => {
    vi.setSystemTime(new Date('2026-10-19T15:00:00.000Z'));
    const sales = [
      makeSale({ unitPrice: 5000, quantity: 2, saleType: 'CONTADO' }),
      makeSale({ unitPrice: 7000, saleType: 'FIADO' }),
      makeSale({ unitPrice: 9000, date: '2026-10-18T15:00:00.000Z', saleType: 'CONTADO' })
    ];

    expect(computeTodaySalesRevenue(sales)).toBe(10000);
  });

  it('computePendingReceivable suma habitacion + fiado + lavanderia y resta reserva/pagos', () => {
    const stay = makeStay({
      total: 120000,
      sales: [makeSale({ unitPrice: 10000, quantity: 2, saleType: 'FIADO' })],
      laundry: [makeLaundry({ totalPrice: 15000 })],
      reservation: {
        id: 1,
        total: 120000,
        payments: [{ type: 'PAGO', amount: 30000 }]
      },
      payments: [{ id: 1, amount: 20000, method: 'EFECTIVO', createdAt: '2026-10-19' }]
    });

    expect(computePendingReceivable([stay])).toBe(105000);
  });

  it('computePendingReceivable nunca devuelve un saldo negativo', () => {
    const stay = makeStay({
      total: 100,
      payments: [{ id: 1, amount: 500, method: 'EFECTIVO', createdAt: '2026-10-19' }]
    });

    expect(computePendingReceivable([stay])).toBe(0);
  });

  it('selectActiveLaundry excluye las ordenes ENTREGADO', () => {
    const active = makeLaundry({ id: 1, status: 'PENDIENTE' });
    const delivered = makeLaundry({ id: 2, status: 'ENTREGADO' });

    expect(selectActiveLaundry([active, delivered])).toEqual([active]);
  });

  it('getLaundryBadge devuelve la etiqueta correcta segun el estado', () => {
    expect(getLaundryBadge('ENTREGADO').label).toBe('Entregado');
    expect(getLaundryBadge('PENDIENTE').label).toBe('Pendiente');
  });
});
