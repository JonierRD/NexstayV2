import { Loader2, CheckCircle, BedDouble } from 'lucide-react';
import { type Habitacion } from '../../lib/api';
import { formatCOP } from '../../lib/format';
import { cn } from '../../lib/utils';
import { roomImage } from '../../lib/room-images';
import { useState } from 'react';

type Props = {
  loading: boolean;
  rooms: Habitacion[];
  availableRooms: Habitacion[];
  selectedRoom: Habitacion | null;
  handleSelectRoom: (room: Habitacion | null) => void;
};

export function AvailableRoomsPanel({
  loading,
  rooms,
  availableRooms,
  selectedRoom,
  handleSelectRoom
}: Props) {
  const [typeFilter, setTypeFilter] = useState<Habitacion['type'] | null>(null);
  const filteredRooms = typeFilter
    ? availableRooms.filter((room) => room.type === typeFilter)
    : availableRooms;
  const filters: Array<{ type: Habitacion['type']; label: string }> = [
    { type: 'SENCILLA', label: 'Sencilla' },
    { type: 'MATRIMONIAL', label: 'Matrimonial' },
    { type: 'DOSCAMAS', label: 'Dos camas' }
  ];

  return (
    <section className="order-last flex min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl border-2 border-sapay-500 bg-white p-4 shadow-md shadow-sapay-900/10 sm:p-5 lg:h-full lg:flex-1">
      <div className="mb-3 flex shrink-0 flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-base font-bold text-sapay-900"><BedDouble size={19} className="text-sapay-700" />Habitaciones disponibles</h3>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filtrar habitaciones por tipo">
          {filters.map(({ type, label }) => (
            <button key={type} type="button" aria-pressed={typeFilter === type} onClick={() => setTypeFilter(typeFilter === type ? null : type)} className={cn('rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition-colors', typeFilter === type ? 'border-sapay-800 bg-sapay-900 text-white' : 'border-sapay-450 bg-sapay-50 text-sapay-750 hover:border-sapay-650 hover:bg-sapay-100')}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading && rooms.length === 0 ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 size={24} className="animate-spin text-sapay-700" />
        </div>
      ) : filteredRooms.length === 0 ? (
        <div className="py-8 text-center text-sm text-sapay-700">
          {typeFilter ? 'No hay habitaciones disponibles de este tipo' : 'No hay habitaciones disponibles'}
        </div>
      ) : (
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1 [scrollbar-width:thin]">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {filteredRooms.map((room) => (
            <button
              key={room.number}
              onClick={() => {
                handleSelectRoom(room);
              }}
              className={cn(
                'w-full overflow-hidden rounded-xl border border-sapay-300 bg-white text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md',
                selectedRoom?.number === room.number
                  ? 'border-sapay-800 ring-2 ring-sapay-700/25'
                  : 'hover:border-sapay-600'
              )}
            >
              <div className="relative h-28 overflow-hidden sm:h-32">
                <img
                  src={roomImage(room.type)}
                  alt={room.type}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute left-2 top-2">
                  <span className="rounded-md bg-sapay-950/90 px-2 py-1 text-sm font-bold text-white shadow">{room.number}</span>
                </div>
                {selectedRoom?.number === room.number && (
                  <div className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-sapay-900">
                    <CheckCircle size={16} className="text-white" />
                  </div>
                )}
              </div>
              <div className="bg-white px-3 py-2.5">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="flex items-center gap-1.5 text-sapay-700">
                    <BedDouble size={14} />
                    {room.hasAir && 'Aire'} {room.hasAir && room.hasFan && '/'} {room.hasFan && 'Ventilador'}
                  </span>
                  <span className="font-medium text-sapay-950">
                    {formatCOP(room.priceWithAir || room.priceWithFan || 0)}
                  </span>
                </div>
              </div>
            </button>
          ))}
          </div>
        </div>
      )}
    </section>
  );
}
