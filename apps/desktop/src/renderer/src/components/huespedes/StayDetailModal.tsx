import { X } from 'lucide-react';
import { type ReactElement } from 'react';
import { type Stay } from '../../lib/api';
import { formatCOP, formatDateTime } from '../../lib/format';

type Props = { stay: Stay; onClose: () => void };

export function StayDetailModal({ stay, onClose }: Props): ReactElement {
  const guest = stay.client ? `${stay.client.firstName} ${stay.client.lastName}` : 'Huésped sin nombre';
  const sales = (stay.sales ?? []).filter((sale) => sale.saleType === 'FIADO' || !sale.saleType);
  const salesTotal = sales.reduce((sum, sale) => sum + Number(sale.unitPrice) * sale.quantity, 0);
  const laundryTotal = (stay.laundry ?? []).reduce((sum, item) => sum + Number(item.totalPrice), 0);
  const reservationPaid = (stay.reservation?.payments ?? []).reduce(
    (sum, payment) => sum + (payment.type === 'PAGO' ? Number(payment.amount) : -Number(payment.amount)), 0
  );
  const paymentsTotal = (stay.payments ?? []).reduce((sum, payment) => sum + Number(payment.amount), 0);
  const roomTotal = Number(stay.pricePerNight) * stay.nights;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 p-4" onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl">
        <div className="flex items-start justify-between border-b border-sapay-200 pb-3">
          <div>
            <h2 className="text-base font-semibold">Detalle del hospedaje</h2>
            <p className="text-xs text-sapay-700">{guest} · Habitación {stay.roomNumber}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar detalle"><X size={18} /></button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-sapay-100 p-3 text-xs">
          <p><span className="text-sapay-650">Cédula: </span>{stay.client?.cc ?? '—'}</p>
          <p><span className="text-sapay-650">Estado: </span>{stay.status === 'FINALIZADA' ? 'Finalizado' : 'Cancelado'}</p>
          <p><span className="text-sapay-650">Entrada: </span>{formatDateTime(stay.checkIn)}</p>
          <p><span className="text-sapay-650">Salida: </span>{stay.checkOut ? formatDateTime(stay.checkOut) : '—'}</p>
          <p><span className="text-sapay-650">Noches: </span>{stay.nights}</p>
          <p><span className="text-sapay-650">Tarifa: </span>{formatCOP(Number(stay.pricePerNight))} / noche</p>
        </div>

        <div className="mt-4 space-y-2 text-xs">
          <h3 className="font-semibold">Resumen de cobro</h3>
          <div className="rounded-xl border border-sapay-300 p-3">
            <div className="flex justify-between"><span>Hospedaje</span><span>{formatCOP(roomTotal)}</span></div>
            <div className="flex justify-between"><span>Ventas fiadas</span><span>{formatCOP(salesTotal)}</span></div>
            <div className="flex justify-between"><span>Lavandería</span><span>{formatCOP(laundryTotal)}</span></div>
            {reservationPaid > 0 && <div className="flex justify-between text-emerald-700"><span>Anticipo de reserva</span><span>−{formatCOP(Math.min(roomTotal, reservationPaid))}</span></div>}
            <div className="mt-2 flex justify-between border-t border-sapay-200 pt-2 font-semibold"><span>Total registrado</span><span>{formatCOP(Number(stay.total))}</span></div>
          </div>
        </div>

        <div className="mt-4 space-y-2 text-xs">
          <h3 className="font-semibold">Pagos registrados</h3>
          {(stay.payments ?? []).length ? (stay.payments ?? []).map((payment) => (
            <div key={payment.id} className="flex justify-between rounded-lg border border-sapay-200 px-3 py-2">
              <span>{payment.method}{payment.reference ? ` · ${payment.reference}` : ''} · {formatDateTime(payment.createdAt)}</span>
              <strong>{formatCOP(Number(payment.amount))}</strong>
            </div>
          )) : <p className="text-sapay-650">No hay pagos registrados.</p>}
          <div className="flex justify-between font-semibold"><span>Total pagado</span><span>{formatCOP(paymentsTotal)}</span></div>
        </div>

        {(sales.length > 0 || (stay.laundry ?? []).length > 0) && (
          <div className="mt-4 space-y-2 text-xs">
            <h3 className="font-semibold">Consumos</h3>
            {sales.map((sale) => <div key={`sale-${sale.id}`} className="flex justify-between"><span>{sale.product?.name ?? `Producto #${sale.productId}`} ×{sale.quantity}</span><span>{formatCOP(Number(sale.unitPrice) * sale.quantity)}</span></div>)}
            {(stay.laundry ?? []).map((item) => <div key={`laundry-${item.id}`} className="flex justify-between"><span>Lavandería: {item.item} ×{item.quantity}</span><span>{formatCOP(Number(item.totalPrice))}</span></div>)}
          </div>
        )}
      </section>
    </div>
  );
}
