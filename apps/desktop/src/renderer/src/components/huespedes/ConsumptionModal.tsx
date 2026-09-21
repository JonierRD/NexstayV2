import { X } from 'lucide-react';
import { type FormEvent, type ReactElement } from 'react';
import { type Stay, type StoreStock } from '../../lib/api';
import { Button } from '../ui/button';

type Props = {
  stay: Stay;
  storeItems: StoreStock[];
  selectedStock: string;
  setSelectedStock: (value: string) => void;
  quantity: string;
  setQuantity: (value: string) => void;
  savingSale: boolean;
  onSubmit: (event: FormEvent) => void;
  onClose: () => void;
};

export function ConsumptionModal({
  stay,
  storeItems,
  selectedStock,
  setSelectedStock,
  quantity,
  setQuantity,
  savingSale,
  onSubmit,
  onClose
}: Props): ReactElement {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
      <form onSubmit={onSubmit} className="relative w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl">
        <button type="button" onClick={onClose} className="absolute right-3 top-3 text-sapay-650">
          <X size={18} />
        </button>
        <h2 className="text-sm font-semibold">Cargar consumo a habitación {stay.roomNumber}</h2>

        <label className="mt-4 block text-[11px] text-sapay-750">
          Producto
          <select
            value={selectedStock}
            onChange={(event) => setSelectedStock(event.target.value)}
            className="mt-1 w-full rounded-lg border border-sapay-400 bg-sapay-100 px-3 py-2 text-xs"
          >
            <option value="">Selecciona un producto</option>
            {storeItems
              .filter((item) => item.quantity > 0)
              .map((item) => (
                <option key={item.id} value={item.id}>
                  {item.product.name} · ${Number(item.product.price).toLocaleString('es-CO')} · Stock {item.quantity}
                </option>
              ))}
          </select>
        </label>

        <label className="mt-3 block text-[11px] text-sapay-750">
          Cantidad
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            className="mt-1 w-full rounded-lg border border-sapay-400 bg-sapay-100 px-3 py-2 text-xs"
          />
        </label>

        <Button disabled={savingSale || !selectedStock} className="mt-4 h-9 w-full rounded-lg bg-sapay-900 text-xs text-white">
          {savingSale ? 'Cargando...' : 'Cargar a habitación'}
        </Button>
      </form>
    </div>
  );
}