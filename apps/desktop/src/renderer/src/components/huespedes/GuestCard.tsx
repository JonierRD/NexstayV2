import { BedDouble, Clock3, DollarSign, LogOut, Moon, UserRound, Wallet } from 'lucide-react';
import { type ReactElement, useEffect, useState } from 'react';
import { type Stay } from '../../lib/api';
import { formatCOP, formatDateTime } from '../../lib/format';
import { Button } from '../ui/Button';
import { computeStayAccount } from './account';
import { elapsed } from './types';

type Props = {
  stay: Stay;
  onCheckout: (stay: Stay) => void;
  onPay: (stay: Stay) => void;
};

export function GuestCard({ stay, onCheckout, onPay }: Props): ReactElement {
  const guest = stay.client ? `${stay.client.firstName} ${stay.client.lastName}` : 'Huésped sin nombre';

  // Fuerza un re-render cada minuto para que "Transcurrido" siga avanzando
  // mientras la tarjeta permanece en pantalla.
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((value) => value + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  const nights = stay.nights || 1;

  // Cuenta por pagar: cargos menos anticipo de reserva y pagos parciales.
  const account = computeStayAccount(stay);

  // Consumos de tienda / mecato pendientes (solo los que quedaron cargados a la cuenta: FIADO o sin tipo)
  const pendingSales = (stay.sales ?? []).filter((sale) => sale.saleType === 'FIADO' || !sale.saleType);

  // Lavandería asociada a la habitación
  const laundryItems = stay.laundry ?? [];

  return (
    <article className="flex flex-col justify-between rounded-2xl border border-sapay-350 bg-white p-4 shadow-[0_8px_20px_rgba(67,42,27,0.05)] transition hover:border-[#cdb9ab]">
      {/* Cabecera: Nombre y Cédula + Estado */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f8eee7] text-[#7a4a34]">
            <UserRound size={17} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-sapay-950 leading-tight">{guest}</h2>
            <p className="text-[10px] text-sapay-650 mt-0.5">CC: {stay.client?.cc ?? 'No disponible'}</p>
          </div>
        </div>
        <span className="rounded-full bg-[#e8f5ec] px-2.5 py-0.5 text-[10px] font-semibold text-[#287344]">
          Activo
        </span>
      </div>

      {/* Datos clave: Habitación, Ingreso y Noches transcurridas */}
      <div className="mt-3 grid grid-cols-3 gap-2 text-[11px]">
        <div className="rounded-xl bg-sapay-100 p-2">
          <p className="text-[10px] text-sapay-650 flex items-center gap-1">
            <BedDouble size={12} className="text-sapay-700" /> Habitación
          </p>
          <strong className="text-sapay-950 text-[12px] mt-0.5 block">
            {stay.roomNumber} <span className="text-[10px] font-normal text-sapay-650">({stay.acTypeUsed === 'AIRE' ? 'Aire' : 'Vent.'})</span>
          </strong>
        </div>

        <div className="rounded-xl bg-sapay-100 p-2">
          <p className="text-[10px] text-sapay-650 flex items-center gap-1">
            <Clock3 size={12} className="text-sapay-700" /> Ingreso
          </p>
          <strong className="text-sapay-950 text-[11px] mt-0.5 block truncate" title={formatDateTime(stay.checkIn)}>
            {formatDateTime(stay.checkIn)}
          </strong>
        </div>

        <div className="rounded-xl bg-sapay-100 p-2">
          <p className="text-[10px] text-sapay-650 flex items-center gap-1">
            <Moon size={12} className="text-sapay-700" /> Transcurrido
          </p>
          <strong className="text-sapay-950 text-[11px] mt-0.5 block">
            {elapsed(stay.checkIn)}
          </strong>
        </div>
      </div>

      {/* Desglose de cuenta por pagar */}
      <div className="mt-3 rounded-xl border border-sapay-300 bg-[#fcfaf8] p-2.5 text-[11px]">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-sapay-700 mb-1.5 flex items-center gap-1">
          <DollarSign size={12} className="text-sapay-800" /> Cuenta por pagar
        </p>
        <div className="space-y-1 text-sapay-750">
          <div className="flex justify-between">
            <span>Hospedaje ({nights} {nights === 1 ? 'noche' : 'noches'}):</span>
            <span className="font-semibold text-sapay-900">{formatCOP(account.roomTotal)}</span>
          </div>

          <div className="flex justify-between">
            <span>Tienda / Mecato ({pendingSales.length} {pendingSales.length === 1 ? 'item' : 'items'} pend.):</span>
            <span className="font-semibold text-sapay-900">{formatCOP(account.salesTotal)}</span>
          </div>

          <div className="flex justify-between">
            <span>Lavandería ({laundryItems.length} {laundryItems.length === 1 ? 'orden' : 'órdenes'}):</span>
            <span className="font-semibold text-sapay-900">{formatCOP(account.laundryTotal)}</span>
          </div>

          {account.reservationCredit > 0 && (
            <div className="flex justify-between text-emerald-700">
              <span>Anticipo de reserva:</span>
              <span className="font-semibold">−{formatCOP(account.reservationCredit)}</span>
            </div>
          )}

          {account.priorPayments > 0 && (
            <div className="flex justify-between text-emerald-700">
              <span>Pagado a cuenta:</span>
              <span className="font-semibold">−{formatCOP(account.priorPayments)}</span>
            </div>
          )}
        </div>

        <div className="mt-2 border-t border-sapay-350 pt-1.5 flex items-center justify-between text-sapay-950">
          <span className="font-bold text-[11px] uppercase tracking-wide">Saldo por pagar:</span>
          <span className="font-black text-[14px] text-sapay-950">{formatCOP(account.balance)}</span>
        </div>
      </div>

      {/* Acciones: pagar sin salir o hacer check-out */}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button
          onClick={() => onPay(stay)}
          disabled={account.balance <= 0}
          className="h-8.5 rounded-xl border border-sapay-350 bg-white text-[11px] font-bold text-sapay-900 hover:bg-sapay-100 disabled:opacity-50 flex items-center justify-center gap-1.5"
        >
          <Wallet size={13} /> Pagar
        </Button>
        <Button
          onClick={() => onCheckout(stay)}
          className="h-8.5 rounded-xl bg-sapay-900 text-[11px] font-bold text-white hover:bg-sapay-850 shadow-sm flex items-center justify-center gap-1.5"
        >
          <LogOut size={13} /> Check-out
        </Button>
      </div>
    </article>
  );
}