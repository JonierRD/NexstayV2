import { ChevronDown, UserRound, X } from 'lucide-react';
import { type CartItem, type Product, type SaleMode, currencyFormatter } from './types';

export function SaleModal({
  mode,
  cart,
  setCart,
  availableProducts,
  activeStays = [],
  selectedStayId,
  setSelectedStayId,
  guestPaymentType = 'FIADO',
  setGuestPaymentType,
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
  guestPaymentType?: 'FIADO' | 'CONTADO';
  setGuestPaymentType?: (value: 'FIADO' | 'CONTADO') => void;
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-3 sm:p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="flex max-h-[88vh] w-full max-w-[650px] flex-col overflow-hidden rounded-[26px] border border-sapay-350 bg-white shadow-[0_25px_60px_rgba(0,0,0,0.28)]">
        {/* Cabecera Fija */}
        <div className="flex shrink-0 items-center justify-between border-b border-sapay-350 bg-sapay-50 px-5 py-3.5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-sapay-750">
              {mode === 'guest' ? 'Venta a huésped' : 'Venta externa'}
            </p>
            <h3 className="text-[17px] font-bold text-sapay-950">Detalle de la venta</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-sapay-650 transition hover:bg-sapay-200 hover:text-sapay-950"
            aria-label="Cerrar modal"
          >
            <X size={16} />
          </button>
        </div>

        {/* Cuerpo con Scroll suave */}
        <div className="flex-1 overflow-y-auto px-5 py-3.5 space-y-3" style={{ scrollbarWidth: 'thin' }}>
          {mode === 'guest' && (
            <>
              <div className="grid gap-2.5 sm:grid-cols-2">
                <div className="rounded-xl border border-sapay-350 bg-sapay-100 p-2.5">
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.08em] text-sapay-750">
                    Habitación
                  </label>
                  <div className="relative">
                    <select
                      value={selectedStayId ?? ''}
                      onChange={(event) => setSelectedStayId(event.target.value ? Number(event.target.value) : null)}
                      className="w-full appearance-none rounded-lg border border-sapay-350 bg-white px-2.5 py-1.5 pr-8 text-[11px] text-sapay-950 outline-none"
                    >
                      <option value="">Selecciona una habitación</option>
                      {activeStays.map((stay) => (
                        <option key={stay.id} value={stay.id}>
                          {stay.roomNumber} — {stay.clientName}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-sapay-750" size={13} />
                  </div>
                </div>

                <div className="rounded-xl border border-sapay-350 bg-sapay-100 p-2.5">
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.08em] text-sapay-750">
                    Huésped
                  </label>
                  <div className="flex items-center gap-2 rounded-lg border border-sapay-350 bg-white px-2.5 py-1.5 text-[11px] text-sapay-950">
                    <UserRound size={13} className="text-sapay-750 shrink-0" />
                    <span className="truncate">
                      {selectedStayId
                        ? activeStays.find((stay) => stay.id === selectedStayId)?.clientName ?? 'Sin huésped'
                        : 'Selecciona una habitación'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-sapay-350 bg-sapay-100 p-2.5">
                <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.08em] text-sapay-750">
                  Condición de Pago
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setGuestPaymentType?.('FIADO')}
                    className={`flex flex-col gap-0.5 rounded-xl border p-2 text-left transition ${
                      guestPaymentType === 'FIADO'
                        ? 'border-amber-600 bg-amber-50 text-amber-950 font-semibold shadow-sm'
                        : 'border-sapay-350 bg-white text-sapay-800 hover:bg-sapay-50'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <span className={`h-2.5 w-2.5 rounded-full ${guestPaymentType === 'FIADO' ? 'bg-amber-600' : 'border border-sapay-400'}`} />
                      🏨 Cargar a la habitación
                    </span>
                    <span className="text-[10px] font-normal text-sapay-600 ml-4">
                      Pendiente por pagar (se cobra en el check-out)
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setGuestPaymentType?.('CONTADO')}
                    className={`flex flex-col gap-0.5 rounded-xl border p-2 text-left transition ${
                      guestPaymentType === 'CONTADO'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-semibold shadow-sm'
                        : 'border-sapay-350 bg-white text-sapay-800 hover:bg-sapay-50'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <span className={`h-2.5 w-2.5 rounded-full ${guestPaymentType === 'CONTADO' ? 'bg-emerald-600' : 'border border-sapay-400'}`} />
                      💵 Pagado de inmediato
                    </span>
                    <span className="text-[10px] font-normal text-sapay-600 ml-4">
                      Pagó en recepción; no sumar a la cuenta
                    </span>
                  </button>
                </div>
              </div>
            </>
          )}

          {mode === 'external' && (
            <div className="rounded-xl border border-sapay-350 bg-sapay-100 p-2.5">
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.08em] text-sapay-750">
                Cliente externo
              </label>
              <input
                type="text"
                value={externalName}
                onChange={(event) => setExternalName(event.target.value)}
                placeholder="Nombre del cliente"
                className="w-full rounded-lg border border-sapay-350 bg-white px-2.5 py-1.5 text-[11px] text-sapay-950 outline-none placeholder:text-[#9d8d85]"
              />
            </div>
          )}

          {/* Sección de Productos con selector fijo y lista con scroll interno */}
          <div className="rounded-xl border border-sapay-350 bg-sapay-100 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-sapay-750">
                Productos en la venta ({cart.length})
              </span>
              <span className="text-[10px] text-sapay-650">
                {cart.reduce((total, item) => total + item.quantity, 0)} unidad(es)
              </span>
            </div>

            {/* Selector de agregar producto: arriba y siempre visible */}
            <div>
              <select
                defaultValue=""
                onChange={(event) => {
                  const value = Number(event.target.value);
                  if (Number.isFinite(value) && value > 0) {
                    addProductToCart(value);
                    event.target.value = '';
                  }
                }}
                className="w-full rounded-lg border border-sapay-350 bg-white px-3 py-1.5 text-[11px] text-sapay-950 outline-none"
              >
                <option value="">+ Selecciona para agregar producto...</option>
                {availableProducts
                  .filter((product) => !cart.some((item) => item.productId === product.id))
                  .map((product) => (
                    <option key={product.stockId} value={product.id}>
                      {product.nombre} · {currencyFormatter.format(product.precio)} (Disp: {product.cantidadDisponible})
                    </option>
                  ))}
              </select>
            </div>

            {/* Lista con scroll interno: no empuja el modal ni desborda la pantalla */}
            <div
              className="max-h-[160px] overflow-y-auto space-y-1.5 pr-1"
              style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(0,0,0,0.18) transparent' }}
            >
              {cart.length === 0 ? (
                <div className="rounded-lg border border-dashed border-[#d7c6bb] bg-white px-3 py-3 text-center text-[11px] text-sapay-750">
                  Usa el selector de arriba para agregar productos a la venta.
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.productId}
                    className="flex items-center justify-between gap-2 rounded-lg border border-sapay-350 bg-white px-2.5 py-1.5 text-[11px]"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sapay-950 truncate leading-tight">{item.nombre}</p>
                      <p className="text-[10px] text-sapay-650">{currencyFormatter.format(item.precio)} c/u</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        className="flex h-6 w-6 items-center justify-center rounded-md border border-sapay-350 bg-sapay-50 text-sapay-900 hover:bg-sapay-200"
                      >
                        −
                      </button>
                      <span className="w-6 text-center font-bold text-sapay-950">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        className="flex h-6 w-6 items-center justify-center rounded-md border border-sapay-350 bg-sapay-50 text-sapay-900 hover:bg-sapay-200"
                      >
                        +
                      </button>
                      <span className="w-16 text-right font-bold text-sapay-950 text-[11px]">
                        {currencyFormatter.format(item.precio * item.quantity)}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeItem(item.productId)}
                        className="ml-1 text-[10px] font-medium text-[#b94646] hover:underline"
                      >
                        Quitar
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Subtotal */}
          <div className="flex items-center justify-between rounded-xl border border-sapay-350 bg-sapay-50 px-3.5 py-2.5">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-sapay-750">Total de la venta</p>
              <p className="text-[18px] font-black text-sapay-950">{currencyFormatter.format(subtotal)}</p>
            </div>
            <div className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-800">
              {cart.reduce((total, item) => total + item.quantity, 0)} unid.
            </div>
          </div>
        </div>

        {/* Pie Fijo Siempre Visible */}
        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-sapay-350 bg-sapay-50 px-5 py-3">
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
            className="rounded-xl bg-[#2b6a50] px-5 py-2 text-[12px] font-bold text-white transition hover:bg-[#235a44] disabled:cursor-not-allowed disabled:opacity-60 shadow-sm"
          >
            {isSubmitting ? 'Confirmando...' : 'Confirmar venta'}
          </button>
        </div>
      </div>
    </div>
  );
}