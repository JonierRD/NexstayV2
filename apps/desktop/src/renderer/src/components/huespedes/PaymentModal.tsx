import {
  AlertTriangle,
  BedDouble,
  CircleDollarSign,
  Package,
  Shirt,
  UserRound,
  Wallet,
  X
} from 'lucide-react';
import { type ReactElement, useMemo, useState } from 'react';
import { type Stay } from '../../lib/api';
import { formatCOP, formatDateTime } from '../../lib/format';
import { computeStayAccount } from './account';

type Props = {
  stay: Stay;
  onClose: () => void;
  onConfirm: (amount: number, method: string, reference?: string) => void;
  isProcessing: boolean;
};

export function PaymentModal({ stay, onClose, onConfirm, isProcessing }: Props): ReactElement {
  const account = useMemo(() => computeStayAccount(stay), [stay]);
  const guestName = stay.client ? `${stay.client.firstName} ${stay.client.lastName}` : 'Huésped sin nombre';
  const cc = stay.client?.cc ?? 'Sin documento';

  const [amount, setAmount] = useState<string>(String(Math.round(account.balance)));
  const [method, setMethod] = useState('Efectivo');
  const [reference, setReference] = useState('');

  const numericAmount = Number(amount.replace(/[^\d.]/g, ''));
  const isValid =
    Number.isFinite(numericAmount) && numericAmount > 0 && numericAmount <= account.balance + 1;

  const remainingAfter = Math.max(0, account.balance - (Number.isFinite(numericAmount) ? numericAmount : 0));

  if (account.balance <= 0) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4"
        onClick={(event) => {
          if (event.target === event.currentTarget && !isProcessing) onClose();
        }}
      >
        <div className="w-full max-w-[420px] rounded-2xl border border-sapay-350 bg-white p-6 text-center shadow-[0_25px_60px_rgba(0,0,0,0.25)]">
          <CircleDollarSign size={40} className="mx-auto mb-3 text-emerald-600" />
          <h2 className="text-[15px] font-bold text-sapay-950">Sin saldo pendiente</h2>
          <p className="mt-1 text-[12px] text-sapay-700">
            {guestName} no tiene cargos por pagar en este momento.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="mt-5 rounded-xl bg-sapay-900 px-5 py-2 text-[12px] font-bold text-white transition hover:bg-sapay-850"
          >
            Entendido
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget && !isProcessing) onClose();
      }}
    >
      <div className="flex max-h-[90vh] w-full max-w-[540px] flex-col overflow-hidden rounded-[26px] border border-sapay-350 bg-white shadow-[0_25px_60px_rgba(0,0,0,0.25)]">
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-sapay-350 bg-sapay-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sapay-900 text-white shadow-sm">
              <Wallet size={18} />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-sapay-950">Registrar pago</h2>
              <p className="text-[11px] text-sapay-650">
                El huésped paga una parte y continúa alojado
              </p>
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

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Resumen del huésped */}
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
                Hab. {stay.roomNumber}
              </p>
              <p className="text-sapay-650 mt-0.5">Ingreso: {formatDateTime(stay.checkIn)}</p>
            </div>
          </div>

          {/* Desglose de la cuenta */}
          <div className="rounded-2xl border border-sapay-350 bg-white p-3.5 text-[11px]">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-sapay-700 mb-2 flex items-center gap-1">
              <CircleDollarSign size={12} className="text-sapay-800" /> Estado de cuenta
            </p>
            <div className="space-y-1.5 text-sapay-750">
              <div className="flex justify-between">
                <span className="flex items-center gap-1"><BedDouble size={11} /> Hospedaje ({stay.nights} {stay.nights === 1 ? 'noche' : 'noches'}):</span>
                <span className="font-semibold text-sapay-900">{formatCOP(account.roomTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="flex items-center gap-1"><Package size={11} /> Tienda / Mecato:</span>
                <span className="font-semibold text-sapay-900">{formatCOP(account.salesTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="flex items-center gap-1"><Shirt size={11} /> Lavandería:</span>
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
                  <span>Pagos previos ({stay.payments?.length ?? 0}):</span>
                  <span className="font-semibold">−{formatCOP(account.priorPayments)}</span>
                </div>
              )}
            </div>
            <div className="mt-2 border-t border-sapay-350 pt-1.5 flex items-center justify-between text-sapay-950">
              <span className="font-bold uppercase tracking-wide">Saldo pendiente:</span>
              <span className="font-black text-[16px]">{formatCOP(account.balance)}</span>
            </div>
          </div>

          {/* Formulario del pago */}
          <div className="rounded-2xl border border-sapay-350 bg-white p-3.5 space-y-3">
            <label className="block text-[11px] font-semibold text-sapay-800">
              Monto a pagar
              <input
                type="number"
                min={1}
                max={account.balance}
                step="1"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                className="mt-1 w-full rounded-lg border border-sapay-350 bg-white px-3 py-2 text-sm font-bold text-sapay-950 focus:border-sapay-500 focus:outline-none"
              />
            </label>

            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setAmount(String(Math.round(account.balance)))}
                className="rounded-lg border border-sapay-350 bg-sapay-50 px-2.5 py-1 text-[10px] font-semibold text-sapay-900 hover:bg-sapay-200"
              >
                Saldo total
              </button>
              <button
                type="button"
                onClick={() => setAmount(String(Math.round(Number(stay.pricePerNight) || 0)))}
                className="rounded-lg border border-sapay-350 bg-sapay-50 px-2.5 py-1 text-[10px] font-semibold text-sapay-900 hover:bg-sapay-200"
              >
                Una noche
              </button>
              {account.salesTotal > 0 && (
                <button
                  type="button"
                  onClick={() => setAmount(String(Math.round(account.salesTotal)))}
                  className="rounded-lg border border-sapay-350 bg-sapay-50 px-2.5 py-1 text-[10px] font-semibold text-sapay-900 hover:bg-sapay-200"
                >
                  Tienda / Mecato
                </button>
              )}
              {account.laundryTotal > 0 && (
                <button
                  type="button"
                  onClick={() => setAmount(String(Math.round(account.laundryTotal)))}
                  className="rounded-lg border border-sapay-350 bg-sapay-50 px-2.5 py-1 text-[10px] font-semibold text-sapay-900 hover:bg-sapay-200"
                >
                  Lavandería
                </button>
              )}
            </div>

            <label className="block text-[11px] font-semibold text-sapay-800">
              Método de pago
              <select
                value={method}
                onChange={(event) => setMethod(event.target.value)}
                className="mt-1 w-full rounded-lg border border-sapay-350 bg-white px-3 py-2 text-xs"
              >
                <option>Efectivo</option>
                <option>Transferencia</option>
                <option>Tarjeta</option>
                <option>Otro</option>
              </select>
            </label>

            <label className="block text-[11px] font-semibold text-sapay-800">
              Referencia (opcional)
              <input
                type="text"
                value={reference}
                onChange={(event) => setReference(event.target.value)}
                placeholder="Nº de comprobante"
                className="mt-1 w-full rounded-lg border border-sapay-350 bg-white px-3 py-2 text-xs"
              />
            </label>

            {isValid && (
              <div className="rounded-lg bg-sapay-100 px-3 py-2 text-[11px] text-sapay-800 flex items-center justify-between">
                <span>Saldo después del pago:</span>
                <span className="font-bold text-sapay-950">{formatCOP(remainingAfter)}</span>
              </div>
            )}
          </div>

          {!isValid && (
            <div className="flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 p-2.5 text-[11px] text-amber-900">
              <AlertTriangle size={15} className="mt-0.5 shrink-0 text-amber-600" />
              <span>Ingresa un monto mayor que cero y que no supere el saldo pendiente.</span>
            </div>
          )}
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
            onClick={() => onConfirm(Math.min(numericAmount, account.balance), method, reference.trim() || undefined)}
            disabled={isProcessing || !isValid}
            className="flex items-center gap-1.5 rounded-xl bg-sapay-900 px-5 py-2 text-[12px] font-bold text-white transition hover:bg-sapay-850 disabled:opacity-60 shadow-sm"
          >
            <Wallet size={14} />
            {isProcessing ? 'Registrando...' : 'Registrar pago'}
          </button>
        </div>
      </div>
    </div>
  );
}
