import { PencilLine, Wrench } from 'lucide-react';
import { type ReactElement } from 'react';
import { cn } from '../../lib/utils';
import { formatCOP } from '../../lib/format';
import { AccentButton } from '../ui/accent-button';
import { DetailLine } from '../ui/detail-line';
import { type Room } from './types';

// Panel derecho: detalle de la habitación seleccionada + botón "Liberar"
export function RoomDetailCard({
  room,
  canManageImage,
  onLiberar,
  onAddImage,
  onRemoveImage
}: {
  room: Room;
  canManageImage: boolean; // solo admin puede cambiar/eliminar imagen
  onLiberar: () => void;
  onAddImage: () => void;
  onRemoveImage: () => void;
}): ReactElement {
  // Cálculo del total a cobrar según el A/C que seleccionó el huésped
  const nights = room.nights ?? 1;
  const selectedPrice = room.selectedAc === 'Aire' && room.priceWithAir > 0 ? room.priceWithAir : room.priceWithFan > 0 ? room.priceWithFan : 0;
  const roomTotal = nights * selectedPrice;
  const grandTotal = roomTotal + room.storeDebt;
  const fmt = formatCOP;

  return (
    <section className="flex min-h-0 w-full flex-col rounded-[26px] border border-[#eadfd6] bg-white shadow-[0_20px_50px_rgba(67,42,27,0.08)] xl:w-[420px]">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[26px]">
        <div className="relative h-[240px] overflow-hidden group">
          {room.image ? (
            <>
              <img src={room.image} alt={room.type} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.05),rgba(0,0,0,0.35))]" />
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[#f6f1eb] text-center">
              <div>
                <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-white text-[#8d7b70] shadow-sm">
                  <Wrench size={22} aria-hidden="true" />
                </div>
                <p className="text-[12px] font-medium text-[#6f6055]">Sin imagen</p>
                <p className="mt-1 text-[10px] text-[#8d7b70]">El administrador puede agregar o reemplazar una imagen</p>
              </div>
            </div>
          )}

          {canManageImage && (
            <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col gap-2 opacity-0 transition-opacity group-hover:opacity-100">
              <button
                type="button"
                onClick={onAddImage}
                className="flex items-center justify-center gap-1.5 rounded-full bg-black/50 px-3 py-1.5 text-[11px] font-medium text-white backdrop-blur-sm hover:bg-black/60"
              >
                <PencilLine size={13} aria-hidden="true" />
                Reemplazar imagen
              </button>
              <button
                type="button"
                onClick={onRemoveImage}
                className="flex items-center justify-center gap-1.5 rounded-full bg-[#a53b35]/85 px-3 py-1.5 text-[11px] font-medium text-white backdrop-blur-sm hover:bg-[#8f2f2a]"
              >
                <Wrench size={13} aria-hidden="true" />
                Eliminar imagen
              </button>
            </div>
          )}

          <div className={cn('absolute right-3 top-3 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white shadow-lg', room.accentTone)}>
            {room.status}
          </div>
          <div className="absolute bottom-3 right-3 text-right">
            <p className="text-[13px] font-bold text-white drop-shadow-lg">{room.priceDisplay}</p>
            <p className="text-[10px] text-white/80 drop-shadow">por noche</p>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-2 p-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-[18px] font-bold tracking-tight text-[#2b1b14]">{room.number}</h3>
              <p className="text-[12px] text-[#6f6055]">{room.description}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 rounded-xl border border-[#ece0d7] bg-[#fcf7f1] px-4 py-3 text-[12px]">
            <DetailLine label="Tipo" value={room.type === 'DOSCAMAS' ? 'Dos Camas' : room.type === 'MATRIMONIAL' ? 'Matrimonial' : 'Sencilla'} />
            <DetailLine label="A/C" value={room.acType} />
          </div>

          <div className="rounded-xl border border-[#c3b5a8] bg-[#f9f0e6] px-4 py-3">
            <h4 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8d7b70]">Precios</h4>
            <div className="mt-1.5 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[12px]">
              {room.priceWithAir > 0 && <DetailLine label="Con aire" value={fmt(room.priceWithAir)} />}
              {room.priceWithFan > 0 && <DetailLine label="Con ventilador" value={fmt(room.priceWithFan)} />}
            </div>
          </div>

          <div className="rounded-xl border border-[#ece0d7] bg-[#fcf7f1] px-4 py-3">
            <h4 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8d7b70]">Huésped Actual</h4>
            <div className="mt-1.5 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[12px]">
              <DetailLine label="Nombre" value={room.guest ?? 'Sin huésped'} />
              <DetailLine label="Noches" value={room.nights?.toString() ?? '1'} />
              <DetailLine label="Seleccionó" value={room.selectedAc ?? '---'} />
            </div>
          </div>

          <div className="rounded-xl border border-[#c3b5a8] bg-[#f9f0e6] px-4 py-3">
            <h4 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8d7b70]">Total a Cobrar</h4>
            <div className="mt-1.5 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[12px]">
              <DetailLine label="Habitación" value={`${fmt(selectedPrice)} × ${nights} ${nights === 1 ? 'noche' : 'noches'}`} />
              <DetailLine label="Subtotal hospedaje" value={fmt(roomTotal)} />
              <DetailLine label="Servicios Extra" value={fmt(room.storeDebt)} />
              <DetailLine label="Total" value={fmt(grandTotal)} />
            </div>
          </div>

          <div className="mt-auto flex gap-2 pt-1">
            <AccentButton onClick={onLiberar} className="flex-1 gap-1.5 h-8 text-[11px] border-[#efb7b7] bg-white text-[#d13d3d] hover:border-[#e5a0a0] hover:bg-[#fff5f5]">
              <Wrench size={13} aria-hidden="true" />
              Liberar
            </AccentButton>
          </div>
        </div>
      </div>
    </section>
  );
}