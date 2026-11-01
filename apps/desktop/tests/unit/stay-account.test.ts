import { describe, expect, it } from 'vitest';
import { computeStayAccount } from '@/components/huespedes/account';
import { makeLaundry, makeSale, makeStay } from '../helpers/fixtures';

describe('U3 - components/huespedes/account.ts', () => {
  it('estancia ACTIVA usa pricePerNight * noches + overtimeAmount', () => {
    const stay = makeStay({
      status: 'ACTIVA',
      pricePerNight: 100000,
      nights: 2,
      total: 200000,
      overtimeAmount: 25000
    });

    expect(computeStayAccount(stay, 2).roomTotal).toBe(225000);
  });

  it('estancia FINALIZADA usa el total guardado', () => {
    const stay = makeStay({
      status: 'FINALIZADA',
      total: 240000,
      pricePerNight: 100000,
      nights: 2
    });

    expect(computeStayAccount(stay).roomTotal).toBe(240000);
  });

  it('suma solo ventas FIADO o sin saleType a salesTotal', () => {
    const stay = makeStay({
      sales: [
        makeSale({ unitPrice: 10000, saleType: 'FIADO' }),
        makeSale({ id: 2, unitPrice: 5000, saleType: 'CONTADO' }),
        makeSale({ id: 3, unitPrice: 3000, saleType: undefined })
      ]
    });

    expect(computeStayAccount(stay).salesTotal).toBe(13000);
  });

  it('suma la lavanderia a laundryTotal', () => {
    const stay = makeStay({
      laundry: [makeLaundry({ totalPrice: 10000 }), makeLaundry({ id: 2, totalPrice: 15000 })]
    });

    expect(computeStayAccount(stay).laundryTotal).toBe(25000);
  });

  it('aplica el credito de la reserva sin superar el total de habitacion', () => {
    const stay = makeStay({
      status: 'FINALIZADA',
      total: 100000,
      reservation: {
        id: 1,
        total: 100000,
        payments: [{ type: 'PAGO', amount: 150000 }]
      }
    });

    expect(computeStayAccount(stay).reservationCredit).toBe(100000);
  });

  it('resta los pagos parciales y calcula chargesTotal, paidTotal y balance', () => {
    const stay = makeStay({
      status: 'FINALIZADA',
      total: 200000,
      pricePerNight: 100000,
      nights: 2,
      sales: [makeSale({ unitPrice: 10000, saleType: 'FIADO' })],
      laundry: [makeLaundry({ totalPrice: 15000 })],
      payments: [{ id: 1, amount: 50000, method: 'EFECTIVO', createdAt: '2026-10-19' }]
    });

    expect(computeStayAccount(stay)).toMatchObject({
      roomTotal: 200000,
      chargesTotal: 225000,
      paidTotal: 50000,
      balance: 175000
    });
  });

  it('balance nunca es negativo', () => {
    const stay = makeStay({
      status: 'FINALIZADA',
      total: 100,
      payments: [{ id: 1, amount: 500, method: 'EFECTIVO', createdAt: '2026-10-19' }]
    });

    expect(computeStayAccount(stay).balance).toBe(0);
  });
});
