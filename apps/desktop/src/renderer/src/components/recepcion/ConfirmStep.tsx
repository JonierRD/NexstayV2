import { Loader2 } from 'lucide-react';
import { type Dispatch, type SetStateAction } from 'react';
import { type Habitacion } from '../../lib/api';
import { cn } from '../../lib/utils';
import { type CheckinStep, type ClientFormData } from './useReception';

type Props = {
  clientData: ClientFormData;
  ccSearch: string;
  selectedRoom: Habitacion | null;
  acType: 'AIRE' | 'VENTILADOR';
  setAcType: Dispatch<SetStateAction<'AIRE' | 'VENTILADOR'>>;
  checkInDate: string;
  setCheckInDate: Dispatch<SetStateAction<string>>;
  nights: number;
  setNights: Dispatch<SetStateAction<number>>;
  calculateEstimatedTotal: () => number;
  loading: boolean;
  handleConfirmCheckin: () => void;
  setStep: Dispatch<SetStateAction<CheckinStep>>;
};

export function ConfirmStep({
  clientData,
  ccSearch,
  selectedRoom,
  acType,
  setAcType,
  checkInDate,
  setCheckInDate,
  nights,
  setNights,
  calculateEstimatedTotal,
  loading,
  handleConfirmCheckin,
  setStep
}: Props) {
  return (
    <div className="space-y-6">
      <div>
        <label className="mb-3 block text-sm font-medium text-[#4b2b21]">
          Confirmar Check-In
        </label>

        <div className="rounded-xl border border-[#ece0d7] bg-[#fcf7f1] p-5">
          <h3 className="mb-4 font-medium text-[#2b1b14]">Datos del Cliente</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center py-2 border-b border-[#dccfca]">
              <span className="text-[#7d6e63]">Nombre:</span>
              <span className="font-medium text-[#2b1b14]">
                {clientData.firstName} {clientData.lastName}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-[#dccfca]">
              <span className="text-[#7d6e63]">Cédula:</span>
              <span className="font-medium text-[#2b1b14]">{ccSearch}</span>
            </div>
            {clientData.phone && (
              <div className="flex justify-between items-center py-2 border-b border-[#dccfca]">
                <span className="text-[#7d6e63]">Teléfono:</span>
                <span className="font-medium text-[#2b1b14]">{clientData.phone}</span>
              </div>
            )}
            {clientData.profession && (
              <div className="flex justify-between items-center py-2">
                <span className="text-[#7d6e63]">Profesión:</span>
                <span className="font-medium text-[#2b1b14]">{clientData.profession}</span>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-[#c3b5a8] bg-[#f9f0e6] p-5">
          <h3 className="mb-4 font-medium text-[#2b1b14]">Datos del Hospedaje</h3>
          <div className="space-y-4 text-sm">
            <div className="flex justify-between items-center py-2 border-b border-[#dccfca]">
              <span className="text-[#7d6e63]">Habitación:</span>
              <span className="font-medium text-[#2b1b14]">{selectedRoom?.number}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-[#dccfca]">
              <span className="text-[#7d6e63]">Tipo:</span>
              <span className="font-medium text-[#2b1b14]">{selectedRoom?.type}</span>
            </div>

            <div>
              <label className="mb-2 block text-xs font-medium text-[#7d6e63]">
                Aire Acondicionado
              </label>
              <div className="grid grid-cols-2 gap-3">
                {selectedRoom?.hasAir && (
                  <button
                    type="button"
                    onClick={() => setAcType('AIRE')}
                    className={cn(
                      'flex items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition',
                      acType === 'AIRE'
                        ? 'border-[#4b2b21] bg-[#4b2b21] text-white shadow-lg shadow-[#4b2b21]/20'
                        : 'border-[#dccfca] bg-white text-[#4b2b21] hover:border-[#bfa89d]'
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
                      'flex items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition',
                      acType === 'VENTILADOR'
                        ? 'border-[#4b2b21] bg-[#4b2b21] text-white shadow-lg shadow-[#4b2b21]/20'
                        : 'border-[#dccfca] bg-white text-[#4b2b21] hover:border-[#bfa89d]'
                    )}
                  >
                    🌀 Ventilador
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-medium text-[#7d6e63]">
                Fecha de Ingreso
              </label>
              <input
                type="date"
                value={checkInDate}
                onChange={(e) => setCheckInDate(e.target.value)}
                className="w-full rounded-lg border border-[#dccfca] px-4 py-2 text-sm focus:border-[#bfa89d] focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-medium text-[#7d6e63]">
                Noches Estimadas
              </label>
              <input
                type="number"
                min="1"
                value={nights}
                onChange={(e) => setNights(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full rounded-lg border border-[#dccfca] px-4 py-2 text-sm focus:border-[#bfa89d] focus:outline-none"
              />
            </div>

            <div className="flex justify-between items-center py-2 border-b border-[#dccfca]">
              <span className="text-[#7d6e63]">Precio/noche:</span>
              <span className="font-medium text-[#2b1b14]">
                ${Math.round(
                  (acType === 'AIRE' ? selectedRoom?.priceWithAir : selectedRoom?.priceWithFan) || 0
                ).toLocaleString('es-CO')}
              </span>
            </div>
            <div className="mt-4 flex justify-between items-center py-3 bg-white rounded-lg px-4">
              <span className="font-bold text-[#4b2b21]">Total Estimado:</span>
              <span className="text-xl font-bold text-[#2b1b14]">
                ${Math.round(calculateEstimatedTotal()).toLocaleString('es-CO')}
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={() => setStep('SELECT_ROOM')}
            className="flex-1 rounded-lg border border-[#dccfca] px-4 py-3 text-sm font-medium text-[#4b2b21] hover:bg-[#faf6f2]"
          >
            ← Volver
          </button>
          <button
            onClick={handleConfirmCheckin}
            disabled={loading}
            className="flex-1 rounded-lg bg-[#4b2b21] px-4 py-3 text-sm font-medium text-white hover:bg-[#3a1a12] disabled:opacity-50"
          >
            {loading ? <Loader2 size={16} className="mx-auto animate-spin" /> : '✅ Confirmar Check-In'}
          </button>
        </div>
      </div>
    </div>
  );
}