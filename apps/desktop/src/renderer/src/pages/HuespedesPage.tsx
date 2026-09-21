import { RefreshCw } from 'lucide-react';
import { type ReactElement } from 'react';
import { type PublicUser } from '../lib/api';
import { AdminPasswordModal } from '../components/AdminPasswordModal';
import { ConsumptionModal } from '../components/huespedes/ConsumptionModal';
import { GuestCard } from '../components/huespedes/GuestCard';
import { useHuespedes } from '../components/huespedes/useHuespedes';
import { Button } from '../components/ui/button';

type Props = { user: PublicUser };

export function HuespedesPage({ user }: Props): ReactElement {
  const g = useHuespedes(user);

  return (
    <div className="flex h-full flex-col gap-3 overflow-auto p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-sm font-semibold">Huéspedes activos</h1>
          <p className="text-[10px] text-sapay-750">Personas alojadas actualmente en el hotel.</p>
        </div>
        <Button
          onClick={() => void g.load()}
          className="h-8 rounded-lg border border-sapay-450 bg-white px-3 text-xs text-sapay-900 hover:bg-sapay-200"
        >
          <RefreshCw size={13} /> Actualizar
        </Button>
      </div>

      {g.error && (
        <div className="rounded-lg border border-danger-200 bg-danger-100 px-3 py-2 text-xs text-[#b33a3a]">
          {g.error}
        </div>
      )}

      {g.loading ? (
        <div className="rounded-lg border border-sapay-350 bg-white p-8 text-center text-xs text-sapay-650">
          Cargando huéspedes...
        </div>
      ) : g.stays.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[#d8c7bb] bg-white p-10 text-center text-xs text-sapay-650">
          No hay huéspedes activos.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          {g.stays.map((stay) => (
            <GuestCard
              key={stay.id}
              stay={stay}
              onConsumption={g.setConsumptionStay}
              onCheckout={g.handleCheckout}
            />
          ))}
        </div>
      )}

      {g.consumptionStay && (
        <ConsumptionModal
          stay={g.consumptionStay}
          storeItems={g.storeItems}
          selectedStock={g.selectedStock}
          setSelectedStock={g.setSelectedStock}
          quantity={g.quantity}
          setQuantity={g.setQuantity}
          savingSale={g.savingSale}
          onSubmit={g.saveConsumption}
          onClose={() => g.setConsumptionStay(null)}
        />
      )}

      {g.checkoutStay && (
        <AdminPasswordModal onClose={() => g.setCheckoutStay(null)} onSuccess={g.checkout} />
      )}
    </div>
  );
}