import { AlertTriangle, BedDouble, CheckCircle2, Clock, LogOut, Package, Shirt, UserRound, X } from 'lucide-react';
import { type ReactElement, useState } from 'react';
import { type Stay } from '../../lib/api';
import { formatCOP, formatDateTime } from '../../lib/format';
import { useSettingsCached } from '../../lib/settingsCache';

function toMinutes(hhmm: string): number {
  const [h = 0, m = 0] = hhmm.split(':').map((part) => Number(part) || 0);
  return h * 60 + m;
}

function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

type Props = {
  stay: Stay;
  onClose: () => void;
  onConfirm: (nights: number) => void;
  isProcessing: boolean;
};

export function CheckoutModal({ stay, onClose, onConfirm, isProcessing }: Props): ReactElement {
  const settings = useSettingsCached();
  const checkoutLimit = (settings?.checkoutLimit ?? '13:00').slice(0, 5) || '13:00';
  const checkoutTolerance = settings?.checkoutTolerance ?? 30;

  const [billableNights, setBillableNights] = useState<number>(stay.nights || 1);
  const guestName = stay.client ? `${stay.client.firstName} ${stay.client.lastName}` : 'Huésped sin nombre';
  const cc = stay.client?.cc ?? 'Sin documento';

  // Días efectivos transcurridos respetando la hora límite de salida: un día
  // cuenta como "extra" solo cuando ya se superó la hora límite (+ tolerancia).
  const checkInDate = new Date(stay.checkIn);
  const now = new Date();
  const limitMinutes = toMinutes(checkoutLimit) + checkoutTolerance;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const naturalDays = Math.max(
    1,
    Math.floor((startOfDay(now).getTime() - startOfDay(checkInDate).getTime()) / (1000 * 60 * 60 * 24)) + 1
  );
  const elapsedDays = nowMinutes >= limitMinutes ? naturalDays : Math.max(1, naturalDays - 1);
  const isOverdue = elapsedDays > stay.nights;
  const overdueDays = elapsedDays - stay.nights;

  const roomPrice = Number(stay.pricePerNight);
  const roomTotal = billableNights * roomPrice;

  // Ventas de tienda / mecato pendientes de pago (FIADO o sin especificar)
  const pendingSales = (stay.sales ?? []).filter((sale) => sale.saleType === 'FIADO' || !sale.saleType);
  const salesTotal = pendingSales.reduce((sum, s) => sum + Number(s.unitPrice) * s.quantity, 0);

  // Ventas de tienda que ya fueron pagadas de contado (para trazabilidad / información)
  const paidSales = (stay.sales ?? []).filter((sale) => sale.saleType === 'CONTADO');

  // Lavandería asociada a la habitación
  const laundryItems = stay.laundry ?? [];
  const laundryTotal = laundryItems.reduce((sum, item) => sum + Number(item.totalPrice), 0);
  const hasPendingLaundry = laundryItems.some((item) => item.status === 'PENDIENTE' || item.status === 'EN_PROCESO');

  const grandTotal = roomTotal + salesTotal + laundryTotal;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget && !isProcessing) onClose();
      }}
    >
      <div className="flex max-h-[90vh] w-full max-w-[620px] flex-col overflow-hidden rounded-[26px] border border-sapay-350 bg-white shadow-[0_25px_60px_rgba(0,0,0,0.25)]">
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-sapay-350 bg-sapay-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sapay-900 text-white shadow-sm">
              <LogOut size={18} />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-sapay-950">Liquidación y Check-out</h2>
              <p className="text-[11px] text-sapay-650">Verifica el resumen de cobro antes de liberar la habitación</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="flex h-8 w-8 items-center justify-center rounded-full text-sapay-650 transition hover:bg-sapay-250 hover:text-sapay-950 disabled:opacity-50"
            aria-label="Cerrar"
          >
            <X size={16} />
          </button>
        </div>

        {/* Contenido con scroll si es largo */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Tarjeta resumen del cliente y habitación */}
          <div className="grid grid-cols-2 gap-3 rounded-2xl border border-sapay-350 bg-sapay-50 p-3.5 text-[11px]">
            <div>
              <p className="text-[10px] uppercase font-semibold tracking-wider text-sapay-600">Huésped</p>
              <p className="font-bold text-sapay-950 text-[13px] flex items-center gap-1.5 mt-0.5">
                <UserRound size={13} className="text-sapay-700" />
                {guestName}
              </p>
              <p className="text-sapay-650 mt-0.5">CC: {cc}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-semibold tracking-wider text-sapay-600">Habitación</p>
              <p className="font-bold text-sapay-950 text-[13px] flex items-center gap-1.5 mt-0.5">
                <BedDouble size={14} className="text-sapay-700" />
                Hab. {stay.roomNumber} ({stay.acTypeUsed === 'AIRE' ? 'Aire Acondicionado' : 'Ventilador'})
              </p>
              <p className="text-sapay-650 mt-0.5 flex items-center gap-1">
                <Clock size={11} /> Ingreso: {formatDateTime(stay.checkIn)}
              </p>
            </div>
          </div>

          {/* Alerta si hay lavandería pendiente */}
          {hasPendingLaundry && (
            <div className="flex items-start gap-2.5 rounded-xl border border-amber-300 bg-amber-50 p-3 text-[11px] text-amber-900">
              <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold">Prendas en proceso:</strong> Hay servicios de lavandería que aún no están marcados como entregados. Asegúrate de verificar las prendas antes de que el huésped se retire.
              </div>
            </div>
          )}

          {/* Política de salida del hotel */}
          <div className="flex items-center gap-2.5 rounded-xl border border-sapay-350 bg-sapay-100 p-3 text-[11px] text-sapay-750">
            <Clock size={14} className="shrink-0 text-sapay-700" />
            <span>
              Hora límite de salida:{' '}
              <strong className="font-semibold text-sapay-900">{checkoutLimit}</strong>
              {' '}con {checkoutTolerance} min de tolerancia. Pasada esa hora cuenta un día adicional.
            </span>
          </div>

          {/* Alerta de Estancia Excedida si aplica */}
          {isOverdue && (
            <div className="flex items-start gap-2.5 rounded-xl border border-amber-300 bg-amber-50 p-3 text-[11px] text-amber-950">
              <AlertTriangle size={15} className="text-amber-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">⚠️ Estancia excedida (+{overdueDays} días transcurridos)</p>
                <p className="text-[10px] text-amber-800 mt-0.5">
                  El huésped pactó {stay.nights} noches al ingresar. Se liquidan las {stay.nights} noches por defecto. Puedes ajustar las noches a liquidar si el huésped autorizó días adicionales.
                </p>
              </div>
            </div>
          )}

          {/* Desglose 1: Hospedaje */}
          <div className="rounded-2xl border border-sapay-350 bg-white p-3.5">
            <div className="flex items-center justify-between text-[12px] font-bold text-sapay-950 mb-2">
              <span className="flex items-center gap-1.5">
                <BedDouble size={14} className="text-sapay-800" />
                1. Hospedaje
              </span>
              <span>{formatCOP(roomTotal)}</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-sapay-700 pl-5">
              <span>Tarifa ({stay.acTypeUsed === 'AIRE' ? 'Aire' : 'Ventilador'}):</span>
              <span className="font-semibold text-sapay-900">{formatCOP(roomPrice)} / noche</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-sapay-700 pl-5 mt-1.5">
              <span>Noches a liquidar:</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setBillableNights((prev) => Math.max(1, prev - 1))}
                  className="flex h-5 w-5 items-center justify-center rounded border border-sapay-350 bg-sapay-50 text-[11px] font-bold text-sapay-900 hover:bg-sapay-200"
                >
                  −
                </button>
                <span className="font-bold text-sapay-950 min-w-5 text-center">{billableNights}</span>
                <button
                  type="button"
                  onClick={() => setBillableNights((prev) => prev + 1)}
                  className="flex h-5 w-5 items-center justify-center rounded border border-sapay-350 bg-sapay-50 text-[11px] font-bold text-sapay-900 hover:bg-sapay-200"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Desglose 2: Tienda / Mecato */}
          <div className="rounded-2xl border border-sapay-350 bg-white p-3.5">
            <div className="flex items-center justify-between text-[12px] font-bold text-sapay-950 mb-2">
              <span className="flex items-center gap-1.5">
                <Package size={14} className="text-sapay-800" />
                2. Consumos Tienda / Mecato
              </span>
              <span>{formatCOP(salesTotal)}</span>
            </div>

            {pendingSales.length === 0 ? (
              <p className="text-[11px] text-sapay-550 pl-5 italic">Sin consumos pendientes cargados a la cuenta.</p>
            ) : (
              <div className="divide-y divide-sapay-200 pl-5 text-[11px]">
                {pendingSales.map((sale) => (
                  <div key={sale.id} className="flex items-center justify-between py-1">
                    <span className="text-sapay-900 font-medium">
                      {sale.product?.name ?? `Producto #${sale.productId}`} <span className="text-sapay-600 font-normal">×{sale.quantity}</span>
                    </span>
                    <span className="text-sapay-750">{formatCOP(Number(sale.unitPrice) * sale.quantity)}</span>
                  </div>
                ))}
              </div>
            )}

            {paidSales.length > 0 && (
              <div className="mt-2.5 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-[10px] text-emerald-800 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <CheckCircle2 size={12} className="text-emerald-600" />
                  {paidSales.length} consumo(s) pagado(s) de contado previamente
                </span>
                <span className="font-semibold text-emerald-700">Ya cancelado</span>
              </div>
            )}
          </div>

          {/* Desglose 3: Lavandería */}
          <div className="rounded-2xl border border-sapay-350 bg-white p-3.5">
            <div className="flex items-center justify-between text-[12px] font-bold text-sapay-950 mb-2">
              <span className="flex items-center gap-1.5">
                <Shirt size={14} className="text-sapay-800" />
                3. Servicio de Lavandería
              </span>
              <span>{formatCOP(laundryTotal)}</span>
            </div>

            {laundryItems.length === 0 ? (
              <p className="text-[11px] text-sapay-550 pl-5 italic">Sin órdenes de lavandería registradas.</p>
            ) : (
              <div className="divide-y divide-sapay-200 pl-5 text-[11px]">
                {laundryItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-1">
                    <span className="text-sapay-900 font-medium">
                      {item.item} ({item.description || 'Prendas'}) <span className="text-sapay-600 font-normal">×{item.quantity}</span>
                      <span className="ml-2 text-[9px] uppercase px-1.5 py-0.5 rounded-full font-semibold bg-sapay-150 text-sapay-700">
                        {item.status}
                      </span>
                    </span>
                    <span className="text-sapay-750">{formatCOP(Number(item.totalPrice))}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Total Gran Final */}
          <div className="flex items-center justify-between rounded-2xl border border-sapay-400 bg-[#f9f1e8] p-4 text-sapay-950">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-sapay-750">Total General a Cobrar</p>
              <p className="text-[10px] text-sapay-650">Hospedaje + Tienda + Lavandería</p>
            </div>
            <div className="text-right">
              <p className="text-[22px] font-black text-sapay-950 leading-tight">{formatCOP(grandTotal)}</p>
            </div>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex items-center justify-end gap-2.5 border-t border-sapay-350 bg-sapay-100 px-6 py-3.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="rounded-xl border border-sapay-350 bg-white px-4 py-2 text-[12px] font-semibold text-sapay-900 transition hover:bg-sapay-50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => onConfirm(billableNights)}
            disabled={isProcessing}
            className="flex items-center gap-1.5 rounded-xl bg-sapay-900 px-5 py-2 text-[12px] font-bold text-white transition hover:bg-sapay-850 disabled:opacity-60 shadow-sm"
          >
            <LogOut size={14} />
            {isProcessing ? 'Procesando salida...' : 'Confirmar Check-out y Cobro'}
          </button>
        </div>
      </div>
    </div>
  );
}
