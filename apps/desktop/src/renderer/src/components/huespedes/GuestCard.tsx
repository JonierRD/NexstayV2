import { BedDouble, Clock3, LogOut, Package, ShoppingBag, UserRound } from 'lucide-react';
import { type ReactElement } from 'react';
import { type Stay } from '../../lib/api';
import { formatDateTime } from '../../lib/format';
import { Button } from '../ui/button';
import { elapsed } from './types';

type Props = {
  stay: Stay;
  onConsumption: (stay: Stay) => void;
  onCheckout: (stay: Stay) => void;
};

export function GuestCard({ stay, onConsumption, onCheckout }: Props): ReactElement {
  const guest = stay.client ? `${stay.client.firstName} ${stay.client.lastName}` : 'Huésped sin nombre';
  const sales = stay.sales ?? [];

  return (
    <article className="rounded-xl border border-sapay-350 bg-white p-4 shadow-[0_8px_20px_rgba(67,42,27,0.05)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f8eee7] text-[#7a4a34]">
            <UserRound size={17} />
          </div>
          <div>
            <h2 className="text-sm font-semibold">{guest}</h2>
            <p className="text-[10px] text-sapay-650">CC: {stay.client?.cc ?? 'No disponible'}</p>
          </div>
        </div>
        <span className="rounded-full bg-[#e8f5ec] px-2 py-1 text-[10px] font-medium text-[#287344]">Activo</span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-[11px]">
        <div className="rounded-lg bg-sapay-100 p-2">
          <p className="text-sapay-650">
            <BedDouble size={13} className="mr-1 inline" />
            Habitación
          </p>
          <strong>{stay.roomNumber}</strong>
        </div>
        <div className="rounded-lg bg-sapay-100 p-2">
          <p className="text-sapay-650">
            <Clock3 size={13} className="mr-1 inline" />
            Ingreso
          </p>
          <strong>{formatDateTime(stay.checkIn)}</strong>
        </div>
        <div className="rounded-lg bg-sapay-100 p-2">
          <p className="text-sapay-650">Noches transcurridas</p>
          <strong>{elapsed(stay.checkIn)}</strong>
        </div>
        <div className="rounded-lg bg-sapay-100 p-2">
          <p className="text-sapay-650">
            <ShoppingBag size={13} className="mr-1 inline" />
            Consumos
          </p>
          <strong>{sales.length ? `${sales.length} producto(s)` : 'Sin consumos'}</strong>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          onClick={() => onConsumption(stay)}
          className="h-8 rounded-lg border border-sapay-450 bg-white text-[11px] text-sapay-900 hover:bg-sapay-200"
        >
          <Package size={13} /> Cargar consumo
        </Button>
        <Button onClick={() => onCheckout(stay)} className="h-8 rounded-lg bg-sapay-900 text-[11px] text-white hover:bg-sapay-850">
          <LogOut size={13} /> Check-out
        </Button>
      </div>
    </article>
  );
}