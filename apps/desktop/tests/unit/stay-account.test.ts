import { describe, it } from 'vitest';

// Responsable: Belladira
// Objetivo: cuenta de un hospedaje (misma logica del backend).
//   import { computeStayAccount } from '@/components/huespedes/account';
//   import { makeClient, makeLaundry, makeSale, makeStay } from '../helpers/fixtures';

describe('U3 - components/huespedes/account.ts', () => {
  it.todo('estancia ACTIVA usa pricePerNight * noches + overtimeAmount');
  it.todo('estancia FINALIZADA usa el total guardado');
  it.todo('suma solo ventas FIADO o sin saleType a salesTotal');
  it.todo('suma la lavanderia a laundryTotal');
  it.todo('aplica el credito de la reserva sin superar el total de habitacion');
  it.todo('resta los pagos parciales y calcula chargesTotal, paidTotal y balance');
  it.todo('balance nunca es negativo');
});
