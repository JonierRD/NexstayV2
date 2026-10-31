import { describe, it } from 'vitest';

// Responsable: Belladira
// Objetivo: calculos del dashboard. Usa los fixtures de tests/helpers/fixtures.ts.
//   import { computeRoomMetrics, computePendingReceivable } from '@/components/dashboard/metrics';
//   import { makeRoom, makeSale, makeStay } from '../helpers/fixtures';

describe('U2 - components/dashboard/metrics.ts', () => {
  it.todo('computeRoomMetrics cuenta total, ocupadas, disponibles y mantenimiento/reservadas');
  it.todo('computeRoomMetrics devuelve 0% de ocupacion cuando no hay habitaciones');
  it.todo('isToday reconoce la fecha de hoy y rechaza ayer/manana');
  it.todo('computeTodaySalesRevenue suma solo ventas CONTADO del dia');
  it.todo('computePendingReceivable suma habitacion + fiado + lavanderia y resta reserva/pagos');
  it.todo('computePendingReceivable nunca devuelve un saldo negativo');
  it.todo('selectActiveLaundry excluye las ordenes ENTREGADO');
  it.todo('getLaundryBadge devuelve la etiqueta correcta segun el estado');
});
