import { AlertTriangle, BedDouble } from 'lucide-react';
import { type Dispatch, type SetStateAction } from 'react';
import { type Habitacion } from '../../lib/api';
import { type Reservation } from '../../lib/api/reservations';
import { formatCOP, formatDateOnly } from '../../lib/format';
import { cn } from '../../lib/utils';
import { type CheckinStep } from './useReception';

type Props = {
  rooms: Habitacion[];
  availableRooms: Habitacion[];
  upcomingByRoom: Map<string, Reservation>;
  selectedRoom: Habitacion | null;
  handleSelectRoom: (room: Habitacion | null) => void;
  acType: 'AIRE' | 'VENTILADOR';
  setAcType: Dispatch<SetStateAction<'AIRE' | 'VENTILADOR'>>;
  setStep: Dispatch<SetStateAction<CheckinStep>>;
};

export function SelectRoomStep({
  rooms,
  availableRooms,
  upcomingByRoom,
  selectedRoom,
  handleSelectRoom,
  acType,
  setAcType,
  setStep
}: Props) {
  const selectedReservation = selectedRoom ? upcomingByRoom.get(selectedRoom.number) : undefined;

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1 [scrollbar-width:thin]">
        <label className="mb-3 block text-sm font-medium text-sapay-900">
          Asignar Habitación
        </label>

        <div className="mb-4">
          <label className="mb-2 block text-xs font-medium text-sapay-700">
            Habitación Disponible
          </label>
          <select
            value={selectedRoom?.number || ''}
            onChange={(e) => {
              handleSelectRoom(rooms.find(r => r.number === e.target.value) || null);
            }}
            className="w-full rounded-lg border border-sapay-450 px-4 py-3 text-sm focus:border-sapay-500 focus:outline-none"
          >
            <option value="">Selecciona una habitación</option>
            {availableRooms.map((room) => (
              <option key={room.number} value={room.number}>
                {room.number} - {room.type} - {room.hasAir ? 'Aire' : ''} {room.hasFan ? 'Ventilador' : ''}
                {upcomingByRoom.has(room.number) ? ` · Reservada desde ${formatDateOnly(upcomingByRoom.get(room.number)!.checkIn)}` : ''}
              </option>
            ))}
          </select>
        </div>

        {selectedRoom && (
          <div className="rounded-xl border border-sapay-300 bg-sapay-150 p-5">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-sapay-900">
                <BedDouble size={28} className="text-white" />
              </div>
              <div className="flex-1">
                <p className="text-lg font-bold text-sapay-950">Habitación {selectedRoom.number}</p>
                <p className="text-sm text-sapay-700">{selectedRoom.type}</p>
              </div>
            </div>

            {selectedReservation && (
              <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-950">
                <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-600" />
                <div>
                  <strong className="font-semibold">Esta habitación está reservada.</strong>{' '}
                  Tiene una reserva confirmada para el <strong>{formatDateOnly(selectedReservation.checkIn)}</strong>
                  {selectedReservation.client ? ` (${selectedReservation.client.firstName} ${selectedReservation.client.lastName})` : ''}.
                  El huésped que registres hoy debe salir antes de esa fecha.
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 text-sm">
              {selectedRoom.hasAir && (
                <div className="rounded-lg border border-sapay-450 bg-white p-3">
                  <p className="text-xs text-sapay-700 mb-1">Precio Aire</p>
                  <p className="text-lg font-bold text-sapay-950">
                    {formatCOP(selectedRoom.priceWithAir || 0)}
                  </p>
                </div>
              )}
              {selectedRoom.hasFan && (
                <div className="rounded-lg border border-sapay-450 bg-white p-3">
                  <p className="text-xs text-sapay-700 mb-1">Precio Ventilador</p>
                  <p className="text-lg font-bold text-sapay-950">
                    {formatCOP(selectedRoom.priceWithFan || 0)}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-xs font-medium text-sapay-700">
              Tipo de Aire Acondicionado
            </label>
            <div className="grid grid-cols-2 gap-3">
              {selectedRoom?.hasAir && (
                <button
                  type="button"
                  onClick={() => setAcType('AIRE')}
                  className={cn(
                    'flex items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition',
                    acType === 'AIRE'
                      ? 'border-sapay-900 bg-sapay-900 text-white shadow-lg shadow-sapay-900/20'
                      : 'border-sapay-450 bg-white text-sapay-900 hover:border-sapay-500'
                  )}
                >
                  ❄️ Aire
                </button>
              )}
              {selectedRoom?.hasFan && (
                <button
                  type="button"
                  onClick={() => setAcType('VENTILADOR')}
                  className={cn(
                    'flex items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition',
                    acType === 'VENTILADOR'
                      ? 'border-sapay-900 bg-sapay-900 text-white shadow-lg shadow-sapay-900/20'
                      : 'border-sapay-450 bg-white text-sapay-900 hover:border-sapay-500'
                  )}
                >
                  🌀 Ventilador
                </button>
              )}
            </div>
          </div>

        </div>

        </div>
        <div className="flex shrink-0 gap-3 border-t border-sapay-200 pt-3">
          <button
            onClick={() => setStep('CLIENT_DATA')}
            className="flex-1 rounded-lg border border-sapay-450 px-4 py-3 text-sm font-medium text-sapay-900 hover:bg-sapay-200"
          >
            ← Volver
          </button>
          <button
            onClick={() => {
              if (selectedRoom) {
                setStep('CONFIRM');
              }
            }}
            disabled={!selectedRoom}
            className="flex-1 rounded-lg bg-sapay-900 px-4 py-3 text-sm font-medium text-white hover:bg-[#3a1a12] disabled:opacity-50"
          >
            Continuar →
          </button>
        </div>
      </div>
    </div>
  );
}
