import { Search, Loader2 } from 'lucide-react';
import { type Dispatch, type SetStateAction } from 'react';
import { type Cliente } from '../../lib/api';
import { type ClientFormData } from './useReception';

type Props = {
  ccSearch: string;
  setCcSearch: Dispatch<SetStateAction<string>>;
  ccHistory: string[];
  handleSearchClient: () => void;
  loading: boolean;
  hasSearched: boolean;
  foundClient: Cliente | null;
  clientData: ClientFormData;
  setClientData: Dispatch<SetStateAction<ClientFormData>>;
  checkInDate: string;
  setCheckInDate: Dispatch<SetStateAction<string>>;
  handleContinueToRoom: () => void;
  onClear: () => void;
};

export function ClientDataStep({
  ccSearch,
  setCcSearch,
  ccHistory,
  handleSearchClient,
  loading,
  hasSearched,
  foundClient,
  clientData,
  setClientData,
  checkInDate,
  setCheckInDate,
  handleContinueToRoom,
  onClear
}: Props) {
  return (
    <div className="space-y-4">
      <div>
        <label className="mb-2 block text-sm font-medium text-[#4b2b21]">
          Cédula del Cliente
        </label>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={ccSearch}
              onChange={(e) => setCcSearch(e.target.value)}
              placeholder="Ingresa cédula del cliente"
              list="cc-history"
              className="w-full rounded-lg border border-[#dccfca] px-4 py-2 text-sm focus:border-[#bfa89d] focus:outline-none"
              onKeyPress={(e) => e.key === 'Enter' && handleSearchClient()}
            />
            <datalist id="cc-history">
              {ccHistory.map((cc) => (
                <option key={cc} value={cc} />
              ))}
            </datalist>
          </div>
          <button
            onClick={handleSearchClient}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-[#4b2b21] px-4 py-2 text-sm font-medium text-white hover:bg-[#3a1a12] disabled:opacity-50"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            Buscar
          </button>
        </div>
      </div>

      {hasSearched && foundClient && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-3">
          <p className="text-sm font-medium text-green-800">
            ✅ Cliente encontrado: {foundClient.firstName} {foundClient.lastName}
          </p>
        </div>
      )}

      {hasSearched && !foundClient && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
          <p className="text-sm font-medium text-blue-800">
            ℹ️ Nuevo cliente - Completa los datos
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-[#7d6e63]">
            Nombre *
          </label>
          <input
            type="text"
            value={clientData.firstName}
            onChange={(e) => setClientData({ ...clientData, firstName: e.target.value })}
            className="w-full rounded-lg border border-[#dccfca] px-3 py-2 text-sm focus:border-[#bfa89d] focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-[#7d6e63]">
            Apellido *
          </label>
          <input
            type="text"
            value={clientData.lastName}
            onChange={(e) => setClientData({ ...clientData, lastName: e.target.value })}
            className="w-full rounded-lg border border-[#dccfca] px-3 py-2 text-sm focus:border-[#bfa89d] focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-[#7d6e63]">
          Teléfono
        </label>
        <input
          type="text"
          value={clientData.phone}
          onChange={(e) => setClientData({ ...clientData, phone: e.target.value })}
          className="w-full rounded-lg border border-[#dccfca] px-3 py-2 text-sm focus:border-[#bfa89d] focus:outline-none"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-[#7d6e63]">
          Fecha de Ingreso
        </label>
        <input
          type="date"
          value={checkInDate}
          onChange={(e) => setCheckInDate(e.target.value)}
          className="w-full rounded-lg border border-[#dccfca] px-3 py-2 text-sm focus:border-[#bfa89d] focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-[#7d6e63]">
            Ciudad Origen
          </label>
          <input
            type="text"
            value={clientData.cityOrigin}
            onChange={(e) => setClientData({ ...clientData, cityOrigin: e.target.value })}
            className="w-full rounded-lg border border-[#dccfca] px-3 py-2 text-sm focus:border-[#bfa89d] focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-[#7d6e63]">
            Ciudad Destino
          </label>
          <input
            type="text"
            value={clientData.cityDestination}
            onChange={(e) => setClientData({ ...clientData, cityDestination: e.target.value })}
            className="w-full rounded-lg border border-[#dccfca] px-3 py-2 text-sm focus:border-[#bfa89d] focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-[#7d6e63]">
          Profesión
        </label>
        <input
          type="text"
          value={clientData.profession}
          onChange={(e) => setClientData({ ...clientData, profession: e.target.value })}
          className="w-full rounded-lg border border-[#dccfca] px-3 py-2 text-sm focus:border-[#bfa89d] focus:outline-none"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-[#7d6e63]">
          Notas
        </label>
        <textarea
          value={clientData.notes}
          onChange={(e) => setClientData({ ...clientData, notes: e.target.value })}
          rows={3}
          className="w-full rounded-lg border border-[#dccfca] px-3 py-2 text-sm focus:border-[#bfa89d] focus:outline-none"
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={onClear}
          className="flex-1 rounded-lg border border-[#dccfca] px-4 py-2 text-sm font-medium text-[#4b2b21] hover:bg-[#faf6f2]"
        >
          Limpiar
        </button>
        <button
          onClick={handleContinueToRoom}
          disabled={!ccSearch || !clientData.firstName || !clientData.lastName}
          className="flex-1 rounded-lg bg-[#4b2b21] px-4 py-2 text-sm font-medium text-white hover:bg-[#3a1a12] disabled:opacity-50"
        >
          Continuar
        </button>
      </div>
    </div>
  );
}