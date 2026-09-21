import { Loader2, CheckCircle } from 'lucide-react';
import { type Habitacion } from '../../lib/api';
import { cn } from '../../lib/utils';
import { roomImage } from '../../lib/room-images';

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
  return (
    <div className="w-96 overflow-y-auto rounded-2xl border border-[#eadfd6] bg-white p-4">
      <h3 className="mb-3 font-medium text-[#4b2b21]">Habitaciones Disponibles</h3>

      {loading && rooms.length === 0 ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 size={24} className="animate-spin text-[#7d6e63]" />
        </div>
      ) : availableRooms.length === 0 ? (
        <div className="py-8 text-center text-sm text-[#7d6e63]">
          No hay habitaciones disponibles
        </div>
      ) : (
        <div className="space-y-3">
          {availableRooms.map((room) => (
            <button
              key={room.number}
              onClick={() => {
                handleSelectRoom(room);
              }}
              className={cn(
                'w-full rounded-xl border-2 overflow-hidden transition-all',
                selectedRoom?.number === room.number
                  ? 'border-[#4b2b21] ring-4 ring-[#4b2b21]/30 scale-[1.02]'
                  : 'border-[#dccfca] hover:border-[#bfa89d] hover:scale-[1.01]'
              )}
            >
              <div className="relative h-32 overflow-hidden">
                <img
                  src={roomImage(room.type)}
                  alt={room.type}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                  <span className="text-lg font-bold text-white">{room.number}</span>
                  <span className="text-xs font-medium text-white bg-black/30 px-2 py-1 rounded-full">
                    {room.type}
                  </span>
                </div>
                {selectedRoom?.number === room.number && (
                  <div className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#4b2b21]">
                    <CheckCircle size={16} className="text-white" />
                  </div>
                )}
              </div>
              <div className="p-3 bg-white">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#7d6e63]">
                    {room.hasAir && 'Aire'} {room.hasAir && room.hasFan && '/'} {room.hasFan && 'Ventilador'}
                  </span>
                  <span className="font-medium text-[#2b1b14]">
                    ${Math.round((room.priceWithAir || room.priceWithFan || 0)).toLocaleString('es-CO')}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}