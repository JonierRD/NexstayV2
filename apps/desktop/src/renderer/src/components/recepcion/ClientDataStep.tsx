import { BriefcaseBusiness, CalendarDays, FileText, Loader2, MapPin, Phone, Search, Trash2, UserRound, ArrowRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { type Dispatch, type ReactNode, type SetStateAction } from 'react';
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

const inputClass = 'w-full rounded-xl border border-sapay-600 bg-sapay-50 px-3 py-2 text-xs text-sapay-950 shadow-sm shadow-sapay-900/5 outline-none transition placeholder:text-sapay-500 focus:border-sapay-800 focus:ring-2 focus:ring-sapay-700/25';

function Field({ label, icon: Icon, children, className = '' }: { label: string; icon: LucideIcon; children: ReactNode; className?: string }) {
  return (
    <label className={`block min-w-0 ${className}`}>
      <span className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold text-sapay-700"><Icon size={13} strokeWidth={2} />{label}</span>
      {children}
    </label>
  );
}

export function ClientDataStep({
  ccSearch, setCcSearch, ccHistory, handleSearchClient, loading, hasSearched,
  foundClient, clientData, setClientData, checkInDate, setCheckInDate,
  handleContinueToRoom, onClear
}: Props) {
  return (
    <div className="flex h-full min-h-0 flex-col gap-2.5">
      <div className="flex shrink-0 flex-col justify-between gap-2 border-b border-sapay-200 pb-2.5 sm:flex-row sm:items-center">
        <h2 className="flex items-center gap-2 text-base font-bold text-sapay-900"><UserRound size={18} className="text-sapay-700" />Ingreso de huésped</h2>
        <div className="flex min-w-0 gap-1.5 sm:w-[58%]">
          <label className="sr-only" htmlFor="reception-cc">Cédula del cliente</label>
          <input
            id="reception-cc"
            type="text"
            value={ccSearch}
            onChange={(event) => setCcSearch(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && handleSearchClient()}
            placeholder="Cédula del cliente"
            list="cc-history"
            className={`${inputClass} min-w-0 flex-1`}
          />
          <datalist id="cc-history">{ccHistory.map((cc) => <option key={cc} value={cc} />)}</datalist>
          <button type="button" onClick={handleSearchClient} disabled={loading} className="flex shrink-0 items-center gap-1.5 rounded-xl bg-sapay-900 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:opacity-90 disabled:opacity-50">
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}Buscar
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto pr-1 [scrollbar-width:thin]">
        {hasSearched && foundClient && <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800">Cliente encontrado: {foundClient.firstName} {foundClient.lastName}</p>}
        {hasSearched && !foundClient && <p className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-medium text-sky-800">Nuevo cliente: completa sus datos</p>}

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <Field label="Nombre *" icon={UserRound}><input type="text" value={clientData.firstName} onChange={(event) => setClientData({ ...clientData, firstName: event.target.value })} placeholder="Nombre del huésped" className={inputClass} /></Field>
          <Field label="Apellido *" icon={UserRound}><input type="text" value={clientData.lastName} onChange={(event) => setClientData({ ...clientData, lastName: event.target.value })} placeholder="Apellido del huésped" className={inputClass} /></Field>
        </div>
        <Field label="Teléfono" icon={Phone}><input type="text" value={clientData.phone} onChange={(event) => setClientData({ ...clientData, phone: event.target.value })} placeholder="Número de teléfono" className={inputClass} /></Field>
        <Field label="Fecha de ingreso" icon={CalendarDays}><input type="date" value={checkInDate} onChange={(event) => setCheckInDate(event.target.value)} className={inputClass} /></Field>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <Field label="Ciudad de origen" icon={MapPin}><input type="text" value={clientData.cityOrigin} onChange={(event) => setClientData({ ...clientData, cityOrigin: event.target.value })} placeholder="Ciudad de origen" className={inputClass} /></Field>
          <Field label="Ciudad de destino" icon={MapPin}><input type="text" value={clientData.cityDestination} onChange={(event) => setClientData({ ...clientData, cityDestination: event.target.value })} placeholder="Ciudad de destino" className={inputClass} /></Field>
        </div>
        <Field label="Profesión" icon={BriefcaseBusiness}><input type="text" value={clientData.profession} onChange={(event) => setClientData({ ...clientData, profession: event.target.value })} placeholder="Profesión" className={inputClass} /></Field>
        <Field label="Notas" icon={FileText}><textarea value={clientData.notes} onChange={(event) => setClientData({ ...clientData, notes: event.target.value })} rows={2} placeholder="Notas adicionales..." className={`${inputClass} resize-y`} /></Field>
      </div>

      <div className="flex shrink-0 gap-2 border-t border-sapay-200 pt-2">
        <button type="button" onClick={onClear} className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-sapay-400 px-4 py-2.5 text-xs font-semibold text-sapay-900 transition hover:bg-sapay-100"><Trash2 size={14} />Limpiar</button>
        <button type="button" onClick={handleContinueToRoom} disabled={!ccSearch || !clientData.firstName || !clientData.lastName} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-sapay-900 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:opacity-90 disabled:opacity-50">Continuar<ArrowRight size={14} /></button>
      </div>
    </div>
  );
}
