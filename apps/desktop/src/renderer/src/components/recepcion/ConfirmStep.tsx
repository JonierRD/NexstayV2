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
        <label className="mb-3 block text-sm font-medium text-sapay-900">
          Confirmar Check-In
        </label>

        <div className="rounded-xl border border-sapay-300 bg-sapay-150 p-5">
          <h3 className="mb-4 font-medium text-sapay-950">Datos del Cliente</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center py-2 border-b border-sapay-450">
              <span className="text-sapay-700">Nombre:</span>
              <span className="font-medium text-sapay-950">
                {clientData.firstName} {clientData.lastName}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-sapay-450">
              <span className="text-sapay-700">Cédula:</span>
              <span className="font-medium text-sapay-950">{ccSearch}</span>
            </div>
            {clientData.phone && (
              <div className="flex justify-between items-center py-2 border-b border-sapay-450">
                <span className="text-sapay-700">Teléfono:</span>
                <span className="font-medium text-sapay-950">{clientData.phone}</span>
              </div>
            )}
            {clientData.profession && (
              <div className="flex justify-between items-center py-2">
                <span className="text-sapay-700">Profesión:</span>
                <span className="font-medium text-sapay-950">{clientData.profession}</span>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-[#c3b5a8] bg-[#f9f0e6] p-5">
          <h3 className="mb-4 font-medium text-sapay-950">Datos del Hospedaje</h3>
          <div className="space-y-4 text-sm">
            <div className="flex justify-between items-center py-2 border-b border-sapay-450">
              <span className="text-sapay-700">Habitación:</span>
              <span className="font-medium text-sapay-950">{selectedRoom?.number}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-sapay-450">
              <span className="text-sapay-700">Tipo:</span>
              <span className="font-medium text-sapay-950">{selectedRoom?.type}</span>
            </div>

            <div>
              <label className="mb-2 block text-xs font-medium text-sapay-700">
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
                      'flex items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition',
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
                className="w-full rounded-lg border border-sapay-450 px-4 py-2 text-sm focus:border-sapay-500 focus:outline-none"
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
                className="w-full rounded-lg border border-sapay-450 px-4 py-2 text-sm focus:border-sapay-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-between items-center py-2 border-b border-sapay-450">
              <span className="text-sapay-700">Precio/noche:</span>
              <span className="font-medium text-sapay-950">
                ${Math.round(
                  (acType === 'AIRE' ? selectedRoom?.priceWithAir : selectedRoom?.priceWithFan) || 0
                ).toLocaleString('es-CO')}
              </span>
            </div>
            <div className="mt-4 flex justify-between items-center py-3 bg-white rounded-lg px-4">
              <span className="font-bold text-sapay-900">Total Estimado:</span>
              <span className="text-xl font-bold text-sapay-950">
                ${Math.round(calculateEstimatedTotal()).toLocaleString('es-CO')}
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={() => setStep('SELECT_ROOM')}
            className="flex-1 rounded-lg border border-sapay-450 px-4 py-3 text-sm font-medium text-sapay-900 hover:bg-sapay-200"
          >
            ← Volver
          </button>
          <button
            onClick={handleConfirmCheckin}
            disabled={loading}
            className="flex-1 rounded-lg bg-sapay-900 px-4 py-3 text-sm font-medium text-white hover:bg-[#3a1a12] disabled:opacity-50"
          >
            {loading ? <Loader2 size={16} className="mx-auto animate-spin" /> : '✅ Confirmar Check-In'}
          </button>
        </div>
      </div>
    </div>
  );
}