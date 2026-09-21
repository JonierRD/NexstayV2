import { BedDouble } from 'lucide-react';
import { type Dispatch, type SetStateAction } from 'react';
import { type Habitacion } from '../../lib/api';
import { cn } from '../../lib/utils';
import { type CheckinStep } from './useReception';

type Props = {
  rooms: Habitacion[];
  availableRooms: Habitacion[];
  selectedRoom: Habitacion | null;
  handleSelectRoom: (room: Habitacion | null) => void;
  acType: 'AIRE' | 'VENTILADOR';
  setAcType: Dispatch<SetStateAction<'AIRE' | 'VENTILADOR'>>;
  checkInDate: string;
  setCheckInDate: Dispatch<SetStateAction<string>>;
  nights: number;
  setNights: Dispatch<SetStateAction<number>>;
  setStep: Dispatch<SetStateAction<CheckinStep>>;
};

export function SelectRoomStep({
  rooms,
  availableRooms,
  selectedRoom,
  handleSelectRoom,
  acType,
  setAcType,
  checkInDate,
  setCheckInDate,
  nights,
  setNights,
  setStep
}: Props) {
  return (
    <div className="space-y-6">
      <div>
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

            <div className="grid grid-cols-2 gap-4 text-sm">
              {selectedRoom.hasAir && (
                <div className="rounded-lg border border-sapay-450 bg-white p-3">
                  <p className="text-xs text-sapay-700 mb-1">Precio Aire</p>
                  <p className="text-lg font-bold text-sapay-950">
                    ${Math.round(selectedRoom.priceWithAir || 0).toLocaleString('es-CO')}
                  </p>
                </div>
              )}
              {selectedRoom.hasFan && (
                <div className="rounded-lg border border-sapay-450 bg-white p-3">
                  <p className="text-xs text-sapay-700 mb-1">Precio Ventilador</p>
                  <p className="text-lg font-bold text-sapay-950">
                    ${Math.round(selectedRoom.priceWithFan || 0).toLocaleString('es-CO')}
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

          <div>
            <label className="mb-2 block text-xs font-medium text-sapay-700">
              Fecha de Ingreso
            </label>
            <input
              type="date"
              value={checkInDate}
              onChange={(e) => setCheckInDate(e.target.value)}
              className="w-full rounded-lg border border-sapay-450 px-4 py-3 text-sm focus:border-sapay-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium text-sapay-700">
              Noches Estimadas
            </label>
            <input
              type="number"
              min="1"
              value={nights}
              onChange={(e) => setNights(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full rounded-lg border border-sapay-450 px-4 py-3 text-sm focus:border-sapay-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
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