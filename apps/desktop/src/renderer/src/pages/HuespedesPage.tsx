import { RefreshCw } from 'lucide-react';
import { type ReactElement, useState } from 'react';
import { type PublicUser } from '../lib/api';
import { CheckoutModal } from '../components/huespedes/CheckoutModal';
import { GuestCard } from '../components/huespedes/GuestCard';
import { StayHistoryList } from '../components/huespedes/StayHistoryList';
import { useHuespedes } from '../components/huespedes/useHuespedes';
import { Button } from '../components/ui/Button';
import { SearchInput } from '../components/ui/SearchInput';

type Props = { user: PublicUser };
type Tab = 'activos' | 'salidos' | 'historial';

function isToday(value: string): boolean {
  const date = new Date(value);
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'activos', label: 'Activos' },
  { id: 'salidos', label: 'Salidos hoy' },
  { id: 'historial', label: 'Historial' }
];

export function HuespedesPage({ user }: Props): ReactElement {
  const g = useHuespedes();
  const [tab, setTab] = useState<Tab>('activos');

  const salidosHoy = g.filteredHistory.filter((stay) => stay.checkOut && isToday(stay.checkOut));

  return (
    <div className="flex h-full flex-col gap-3 overflow-auto p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-sm font-semibold">Huéspedes</h1>
          <p className="text-[10px] text-sapay-750">Personas alojadas, salidas del día e historial de hospedajes.</p>
        </div>
        <Button
          onClick={() => void g.load()}
          className="h-8 rounded-lg border border-sapay-450 bg-white px-3 text-xs text-sapay-900 hover:bg-sapay-200"
        >
          <RefreshCw size={13} /> Actualizar
        </Button>
      </div>

      {/* Pestañas */}
      <div className="flex items-center gap-1 rounded-xl border border-sapay-350 bg-white p-1 w-fit">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold transition ${
              tab === t.id ? 'bg-sapay-900 text-white shadow-sm' : 'text-sapay-750 hover:bg-sapay-150'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Búsqueda para las vistas de salidas/historial */}
      {tab !== 'activos' && (
        <SearchInput
          value={g.historyQuery}
          onChange={g.setHistoryQuery}
          placeholder="Buscar por nombre, cédula o habitación"
        />
      )}

      {g.error && (
        <div className="rounded-lg border border-danger-200 bg-danger-100 px-3 py-2 text-xs text-[#b33a3a]">
          {g.error}
        </div>
      )}

      {g.loading ? (
        <div className="rounded-lg border border-sapay-350 bg-white p-8 text-center text-xs text-sapay-650">
          Cargando huéspedes...
        </div>
      ) : tab === 'activos' ? (
        g.stays.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[#d8c7bb] bg-white p-10 text-center text-xs text-sapay-650">
            No hay huéspedes activos.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {g.stays.map((stay) => (
              <GuestCard
                key={stay.id}
                stay={stay}
                onCheckout={g.handleCheckoutClick}
              />
            ))}
          </div>
        )
      ) : (
        <StayHistoryList
          stays={tab === 'salidos' ? salidosHoy : g.filteredHistory}
          emptyMessage={
            tab === 'salidos'
              ? 'No hubo salidas registradas hoy.'
              : 'Aún no hay hospedajes finalizados o cancelados.'
          }
        />
      )}

      {g.checkoutStay && (
        <CheckoutModal
          stay={g.checkoutStay}
          onClose={() => g.setCheckoutStay(null)}
          onConfirm={(nights, method, confirmed) => void g.confirmCheckout(nights, method, confirmed)}
          isProcessing={g.isCheckingOut}
        />
      )}
    </div>
  );
}