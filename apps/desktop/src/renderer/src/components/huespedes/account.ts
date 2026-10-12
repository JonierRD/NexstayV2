import { type Stay } from '../../lib/api';

export type StayAccountSummary = {
  roomTotal: number;
  salesTotal: number;
  laundryTotal: number;
  reservationCredit: number;
  priorPayments: number;
  chargesTotal: number;
  paidTotal: number;
  balance: number;
};

/**
 * Resumen de la cuenta de un hospedaje. Debe reflejar la misma lógica del
 * backend: cargos (hospedaje + tienda fiada + lavandería) menos lo ya pagado
 * (crédito de la reserva + pagos parciales).
 */
export function computeStayAccount(stay: Stay, nights?: number): StayAccountSummary {
  const roomTotal = Number(stay.pricePerNight) * (nights ?? stay.nights ?? 1);
  const salesTotal = (stay.sales ?? [])
    .filter((sale) => sale.saleType === 'FIADO' || !sale.saleType)
    .reduce((sum, sale) => sum + Number(sale.unitPrice) * sale.quantity, 0);
  const laundryTotal = (stay.laundry ?? []).reduce(
    (sum, item) => sum + Number(item.totalPrice),
    0
  );
  const reservationPaid = (stay.reservation?.payments ?? []).reduce(
    (sum, payment) => sum + (payment.type === 'PAGO' ? Number(payment.amount) : -Number(payment.amount)),
    0
  );
  const reservationCredit = Math.min(roomTotal, Math.max(0, reservationPaid));
  const priorPayments = (stay.payments ?? []).reduce(
    (sum, payment) => sum + Number(payment.amount),
    0
  );
  const chargesTotal = roomTotal + salesTotal + laundryTotal;
  const paidTotal = reservationCredit + priorPayments;
  const balance = Math.max(0, chargesTotal - paidTotal);

  return {
    roomTotal,
    salesTotal,
    laundryTotal,
    reservationCredit,
    priorPayments,
    chargesTotal,
    paidTotal,
    balance
  };
}
