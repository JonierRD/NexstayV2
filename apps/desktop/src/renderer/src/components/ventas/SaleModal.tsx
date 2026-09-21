import { ChevronDown, UserRound, X } from 'lucide-react';
import { type CartItem, type Product, type SaleMode, currencyFormatter } from './types';

export function SaleModal({
  mode,
  cart,
  setCart,
  availableProducts,
  activeStays,
  selectedStayId,
  setSelectedStayId,
  externalName,
  setExternalName,
  onClose,
  onConfirm,
  isSubmitting
}: {
  mode: SaleMode;
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  availableProducts: Product[];
  activeStays: Array<{ id: number; roomNumber: string; clientName: string; cc: string }>;
  selectedStayId: number | null;
  setSelectedStayId: (value: number | null) => void;
  externalName: string;
  setExternalName: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
  isSubmitting: boolean;
}) {
  const subtotal = cart.reduce((sum, item) => sum + item.precio * item.quantity, 0);

  const addProductToCart = (productId: number) => {
    const product = availableProducts.find((item) => item.id === productId);
    if (!product) return;

    setCart((current) => {
      const exists = current.find((item) => item.productId === product.id);
      if (exists) {
        return current.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: Math.min(item.cantidadDisponible, item.quantity + 1) }
            : item
        );
      }

      return [
        ...current,
        {
          stockId: product.stockId,
          productId: product.id,
          nombre: product.nombre,
          precio: product.precio,
          cantidadDisponible: product.cantidadDisponible,
          quantity: 1
        }
      ];
    });
  };

  const updateQuantity = (productId: number, nextQuantity: number) => {
    setCart((current) =>
      current
        .map((item) => {
          if (item.productId !== productId) return item;
          const safeQuantity = Math.max(1, Math.min(item.cantidadDisponible, nextQuantity));
          return { ...item, quantity: safeQuantity };
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const removeItem = (productId: number) => {
    setCart((current) => current.filter((item) => item.productId !== productId));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
      <div className="w-full max-w-[700px] rounded-[26px] border border-sapay-350 bg-white p-5 shadow-[0_26px_80px_rgba(0,0,0,0.28)]">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-sapay-750">
              {mode === 'guest' ? 'Venta a huésped' : 'Venta externa'}
            </p>
            <h3 className="mt-1 text-[20px] font-bold text-sapay-950">Detalle de la venta</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-sapay-350 bg-sapay-50 text-sapay-900 hover:border-[#d8c5b8]"
            aria-label="Cerrar modal"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4">
          {mode === 'guest' && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-sapay-350 bg-sapay-100 p-3">
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.08em] text-sapay-750">
                  Habitación
                </label>
                <div className="relative">
                  <select
                    value={selectedStayId ?? ''}
                    onChange={(event) => setSelectedStayId(event.target.value ? Number(event.target.value) : null)}
                    className="w-full appearance-none rounded-xl border border-sapay-350 bg-white px-3 py-2 pr-8 text-[12px] text-sapay-950 outline-none"
                  >
                    <option value="">Selecciona una habitación</option>
                    {activeStays.map((stay) => (
                      <option key={stay.id} value={stay.id}>
                        {stay.roomNumber} — {stay.clientName}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sapay-750" size={14} />
                </div>
              </div>

              <div className="rounded-2xl border border-sapay-350 bg-sapay-100 p-3">
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.08em] text-sapay-750">
                  Huésped
                </label>
                <div className="flex items-center gap-2 rounded-xl border border-sapay-350 bg-white px-3 py-2 text-[12px] text-sapay-950">
                  <UserRound size={14} className="text-sapay-750" />
                  <span>
                    {selectedStayId
                      ? activeStays.find((stay) => stay.id === selectedStayId)?.clientName ?? 'Sin huésped'
                      : 'Selecciona una habitación'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {mode === 'external' && (
            <div className="rounded-2xl border border-sapay-350 bg-sapay-100 p-3">
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.08em] text-sapay-750">
                Cliente
              </label>
              <input
                type="text"
                value={externalName}
                onChange={(event) => setExternalName(event.target.value)}
                placeholder="Nombre del cliente"
                className="w-full rounded-xl border border-sapay-350 bg-white px-3 py-2 text-[12px] text-sapay-950 outline-none placeholder:text-[#9d8d85]"
              />
            </div>
          )}

          <div className="rounded-2xl border border-sapay-350 bg-sapay-100 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-sapay-750">Productos</span>
              <span className="text-[10px] text-sapay-750">{cart.length} en la venta</span>
            </div>

            <div className="space-y-2">
              {cart.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[#d7c6bb] bg-white px-3 py-4 text-center text-[11px] text-sapay-750">
                  Agrega un producto para iniciar la venta.
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.productId} className="flex flex-col gap-2 rounded-xl border border-sapay-350 bg-white p-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-[12px] font-semibold text-sapay-950">{item.nombre}</p>
                      <p className="text-[10px] text-sapay-750">{currencyFormatter.format(item.precio)} c/u</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-sapay-350 bg-sapay-50 text-sapay-900"
                      >
                        −
                      </button>
                      <span className="w-8 text-center text-[12px] font-semibold text-sapay-950">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-sapay-350 bg-sapay-50 text-sapay-900"
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() => removeItem(item.productId)}
                        className="ml-2 text-[10px] font-medium text-[#b94646]"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-3 flex items-center gap-2">
              <select
                defaultValue=""
                onChange={(event) => {
                  const value = Number(event.target.value);
                  if (Number.isFinite(value) && value > 0) {
                    addProductToCart(value);
                    event.target.value = '';
                  }
                }}
                className="flex-1 rounded-xl border border-sapay-350 bg-white px-3 py-2 text-[12px] text-sapay-950 outline-none"
              >
                <option value="">Agregar producto...</option>
                {availableProducts
                  .filter((product) => !cart.some((item) => item.productId === product.id))
                  .map((product) => (
                    <option key={product.stockId} value={product.id}>
                      {product.nombre} · {currencyFormatter.format(product.precio)}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-sapay-350 bg-sapay-50 p-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-sapay-750">Total</p>
              <p className="mt-1 text-[18px] font-bold text-sapay-950">{currencyFormatter.format(subtotal)}</p>
            </div>
            <div className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700">
              {cart.reduce((total, item) => total + item.quantity, 0)} unidades
            </div>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[#d7c6bb] bg-white px-4 py-2 text-[12px] font-semibold text-sapay-900 transition hover:bg-[#fff9f5]"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting || cart.length === 0 || (mode === 'guest' && !selectedStayId)}
            className="rounded-xl bg-[#2b6a50] px-4 py-2 text-[12px] font-semibold text-white transition hover:bg-[#235a44] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Confirmando...' : 'Confirmar venta'}
          </button>
        </div>
      </div>
    </div>
  );
}