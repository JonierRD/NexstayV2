import {
  CalendarRange,
  ChevronDown,
  CircleDollarSign,
  PackageCheck,
  Search,
  ShoppingCart,
  ShoppingCartIcon,
  Sparkles,
  UserRound,
  Users,
  X
} from 'lucide-react';
import { useEffect, useMemo, useState, type ReactElement } from 'react';
import {
  ApiError,
  createSalesRequest,
  inventoryRequest,
  salesRequest,
  staysActiveRequest,
  type PublicUser,
  type Stay,
  type StockItem
} from '../lib/api';
import { cn } from '../lib/utils';

const currencyFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0
});

type Product = {
  stockId: number;
  id: number;
  nombre: string;
  precio: number;
  cantidadDisponible: number;
  categoria?: string;
};

type CartItem = {
  stockId: number;
  productId: number;
  nombre: string;
  precio: number;
  cantidadDisponible: number;
  quantity: number;
};

type SaleMode = 'guest' | 'external';

type SaleRecord = {
  id: number;
  fecha: string;
  producto: string;
  cantidad: number;
  precioUnitario: number;
  total: number;
  tipoVenta: 'Huésped' | 'Externa';
  habitacion?: string;
  huesped?: string;
  clienteExterno?: string;
};

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

function ProductCard({ product, onOpenModal }: { product: Product; onOpenModal: (product: Product, mode: SaleMode) => void }) {
  return (
    <div className="rounded-2xl border border-[#eadfd6] bg-white p-4 shadow-[0_12px_32px_rgba(52,39,28,0.04)] transition hover:-translate-y-0.5 hover:border-[#d9cabd] hover:shadow-[0_16px_40px_rgba(52,39,28,0.08)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[13px] font-semibold text-[#2b1b14]">{product.nombre}</p>
          <p className="mt-1 text-[11px] text-[#7d6d61]">{product.categoria ?? 'Inventario'}</p>
        </div>
        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-semibold text-emerald-700">
          Disponible
        </span>
      </div>

      <div className="mt-4 space-y-2 text-[12px] text-[#4b2b21]">
        <div className="flex items-center justify-between">
          <span className="text-[#7d6d61]">Precio</span>
          <span className="font-semibold text-[#2b1b14]">{currencyFormatter.format(product.precio)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[#7d6d61]">Disponibles</span>
          <span className="font-semibold text-[#2b1b14]">{product.cantidadDisponible}</span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onOpenModal(product, 'guest')}
          className="rounded-xl bg-[#f3c34a] px-3 py-2 text-[11px] font-semibold text-[#2b1b14] transition hover:bg-[#edb92d]"
        >
          Vender a huésped
        </button>
        <button
          type="button"
          onClick={() => onOpenModal(product, 'external')}
          className="rounded-xl border border-[#d7c6bb] bg-[#fffaf5] px-3 py-2 text-[11px] font-semibold text-[#4b2b21] transition hover:border-[#cdb9ab] hover:bg-[#fff5ee]"
        >
          Venta externa
        </button>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, icon: Icon, tint }: { label: string; value: string; icon: typeof ShoppingCart; tint: string }) {
  return (
    <div className="rounded-2xl border border-[#eadfd6] bg-white p-4 shadow-[0_12px_30px_rgba(52,39,28,0.04)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[#7d6d61]">{label}</p>
          <p className="mt-2 text-[20px] font-bold text-[#2b1b14]">{value}</p>
        </div>
        <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', tint)}>
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}

function SaleModal({
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
      <div className="w-full max-w-[700px] rounded-[26px] border border-[#eadfd6] bg-white p-5 shadow-[0_26px_80px_rgba(0,0,0,0.28)]">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#7d6d61]">
              {mode === 'guest' ? 'Venta a huésped' : 'Venta externa'}
            </p>
            <h3 className="mt-1 text-[20px] font-bold text-[#2b1b14]">Detalle de la venta</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#eadfd6] bg-[#fffaf5] text-[#4b2b21] hover:border-[#d8c5b8]"
            aria-label="Cerrar modal"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4">
          {mode === 'guest' && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-[#eadfd6] bg-[#fcfaf8] p-3">
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.08em] text-[#7d6d61]">
                  Habitación
                </label>
                <div className="relative">
                  <select
                    value={selectedStayId ?? ''}
                    onChange={(event) => setSelectedStayId(event.target.value ? Number(event.target.value) : null)}
                    className="w-full appearance-none rounded-xl border border-[#eadfd6] bg-white px-3 py-2 pr-8 text-[12px] text-[#2b1b14] outline-none"
                  >
                    <option value="">Selecciona una habitación</option>
                    {activeStays.map((stay) => (
                      <option key={stay.id} value={stay.id}>
                        {stay.roomNumber} — {stay.clientName}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#7d6d61]" size={14} />
                </div>
              </div>

              <div className="rounded-2xl border border-[#eadfd6] bg-[#fcfaf8] p-3">
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.08em] text-[#7d6d61]">
                  Huésped
                </label>
                <div className="flex items-center gap-2 rounded-xl border border-[#eadfd6] bg-white px-3 py-2 text-[12px] text-[#2b1b14]">
                  <UserRound size={14} className="text-[#7d6d61]" />
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
            <div className="rounded-2xl border border-[#eadfd6] bg-[#fcfaf8] p-3">
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.08em] text-[#7d6d61]">
                Cliente
              </label>
              <input
                type="text"
                value={externalName}
                onChange={(event) => setExternalName(event.target.value)}
                placeholder="Nombre del cliente"
                className="w-full rounded-xl border border-[#eadfd6] bg-white px-3 py-2 text-[12px] text-[#2b1b14] outline-none placeholder:text-[#9d8d85]"
              />
            </div>
          )}

          <div className="rounded-2xl border border-[#eadfd6] bg-[#fcfaf8] p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#7d6d61]">Productos</span>
              <span className="text-[10px] text-[#7d6d61]">{cart.length} en la venta</span>
            </div>

            <div className="space-y-2">
              {cart.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[#d7c6bb] bg-white px-3 py-4 text-center text-[11px] text-[#7d6d61]">
                  Agrega un producto para iniciar la venta.
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.productId} className="flex flex-col gap-2 rounded-xl border border-[#eadfd6] bg-white p-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-[12px] font-semibold text-[#2b1b14]">{item.nombre}</p>
                      <p className="text-[10px] text-[#7d6d61]">{currencyFormatter.format(item.precio)} c/u</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#eadfd6] bg-[#fffaf5] text-[#4b2b21]"
                      >
                        −
                      </button>
                      <span className="w-8 text-center text-[12px] font-semibold text-[#2b1b14]">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#eadfd6] bg-[#fffaf5] text-[#4b2b21]"
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
                className="flex-1 rounded-xl border border-[#eadfd6] bg-white px-3 py-2 text-[12px] text-[#2b1b14] outline-none"
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

          <div className="flex items-center justify-between rounded-2xl border border-[#eadfd6] bg-[#fffaf5] p-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#7d6d61]">Total</p>
              <p className="mt-1 text-[18px] font-bold text-[#2b1b14]">{currencyFormatter.format(subtotal)}</p>
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
            className="rounded-xl border border-[#d7c6bb] bg-white px-4 py-2 text-[12px] font-semibold text-[#4b2b21] transition hover:bg-[#fff9f5]"
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

export function VentasPage({ user }: { user: PublicUser }): ReactElement {
  const [products, setProducts] = useState<Product[]>([]);
  const [activeStays, setActiveStays] = useState<Array<{ id: number; roomNumber: string; clientName: string; cc: string }>>([]);
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [search, setSearch] = useState('');
  const [historySearch, setHistorySearch] = useState('');
  const [historyType, setHistoryType] = useState('Todos');
  const [historyDate, setHistoryDate] = useState('');
  const [modalMode, setModalMode] = useState<SaleMode | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedStayId, setSelectedStayId] = useState<number | null>(null);
  const [externalName, setExternalName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        const [stockItems, staysData, salesData] = await Promise.all([
          inventoryRequest(),
          staysActiveRequest(),
          salesRequest()
        ]);

        const mappedProducts = stockItems
          .filter((item) => item.quantity > 0)
          .map((item) => ({
            stockId: item.id,
            id: item.product.id,
            nombre: item.product.name,
            precio: Number(item.product.price),
            cantidadDisponible: item.quantity,
            categoria: item.product.category
          }));

        setProducts(mappedProducts);

        const mappedStays = staysData
          .filter((stay) => stay.status === 'ACTIVA')
          .map((stay) => ({
            id: stay.id,
            roomNumber: stay.roomNumber,
            clientName: stay.client ? `${stay.client.firstName} ${stay.client.lastName}` : 'Huésped sin nombre',
            cc: stay.client?.cc ?? 'Sin cédula'
          }));

        setActiveStays(mappedStays);
        setSelectedStayId(mappedStays[0]?.id ?? null);

        const mappedSales: SaleRecord[] = salesData.map((sale) => ({
          id: sale.id,
          fecha: sale.date ?? new Date().toISOString(),
          producto: sale.product?.name ?? 'Producto',
          cantidad: sale.quantity,
          precioUnitario: Number(sale.unitPrice ?? 0),
          total: Number(sale.unitPrice ?? 0) * Number(sale.quantity ?? 0),
          tipoVenta: sale.stayId ? 'Huésped' : 'Externa',
          habitacion: sale.stay?.roomNumber,
          huesped: sale.stay?.client ? `${sale.stay.client.firstName} ${sale.stay.client.lastName}` : undefined,
          clienteExterno: sale.stayId ? undefined : 'Cliente externo'
        }));

        setSales(mappedSales);
      } catch (err) {
        const message =
          err instanceof ApiError
            ? err.message
            : err instanceof Error
              ? err.message
              : 'No se pudo cargar la información real del módulo de ventas.';

        console.error('[VentasPage] No se pudo cargar la información real del módulo de ventas:', err);

        if (message.toLowerCase().includes('401') || message.toLowerCase().includes('unauthorized')) {
          setError('La sesión ha expirado o no tienes permiso para ver este módulo. Inicia sesión nuevamente.');
        } else if (
          message.toLowerCase().includes('fetch') ||
          message.toLowerCase().includes('network') ||
          message.toLowerCase().includes('failed to fetch')
        ) {
          setError('No se pudo conectar con la API de SAPAY. Verifica que el backend esté ejecutándose.');
        } else {
          setError(message);
        }
      } finally {
        setLoading(false);
      }
    }

    void loadData();
  }, []);

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return products;
    return products.filter((product) => product.nombre.toLowerCase().includes(term));
  }, [products, search]);

  const summary = useMemo(() => {
    const today = new Date();
    const totalToday = sales
      .filter((sale) => {
        const saleDate = new Date(sale.fecha);
        return saleDate.toDateString() === today.toDateString();
      })
      .reduce((sum, sale) => sum + sale.total, 0);

    const guestSales = sales.filter((sale) => sale.tipoVenta === 'Huésped').length;
    const externalSales = sales.filter((sale) => sale.tipoVenta === 'Externa').length;
    const soldUnits = sales.reduce((sum, sale) => sum + sale.cantidad, 0);

    return [
      { label: 'Ventas de hoy', value: currencyFormatter.format(totalToday), icon: CircleDollarSign, tint: 'bg-emerald-50 text-emerald-700' },
      { label: 'Productos vendidos', value: String(soldUnits), icon: PackageCheck, tint: 'bg-[#f9ebd2] text-[#8c5a14]' },
      { label: 'Ventas a huéspedes', value: String(guestSales), icon: Users, tint: 'bg-sky-50 text-sky-700' },
      { label: 'Ventas externas', value: String(externalSales), icon: ShoppingCartIcon, tint: 'bg-rose-50 text-rose-700' }
    ];
  }, [sales]);

  const filteredSales = useMemo(() => {
    const baseSearch = historySearch.trim().toLowerCase();

    return sales.filter((sale) => {
      const matchesSearch =
        !baseSearch ||
        sale.producto.toLowerCase().includes(baseSearch) ||
        (sale.huesped && sale.huesped.toLowerCase().includes(baseSearch)) ||
        (sale.clienteExterno && sale.clienteExterno.toLowerCase().includes(baseSearch));

      const matchesType = historyType === 'Todos' || sale.tipoVenta === historyType;
      const matchesDate = !historyDate || new Date(sale.fecha).toISOString().slice(0, 10) === historyDate;

      return matchesSearch && matchesType && matchesDate;
    });
  }, [historyDate, historySearch, historyType, sales]);

  const openSaleModal = (product: Product, mode: SaleMode) => {
    setModalMode(mode);
    setCart([
      {
        stockId: product.stockId,
        productId: product.id,
        nombre: product.nombre,
        precio: product.precio,
        cantidadDisponible: product.cantidadDisponible,
        quantity: 1
      }
    ]);
    setExternalName('');
    setSelectedStayId(activeStays[0]?.id ?? null);
  };

  const closeSaleModal = () => {
    setModalMode(null);
    setCart([]);
    setExternalName('');
  };

  const handleConfirmSale = async () => {
    if (!modalMode || cart.length === 0) return;

    if (modalMode === 'guest' && !selectedStayId) {
      setError('Debes seleccionar una habitación con huésped activo.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await createSalesRequest({
        items: cart.map((item) => ({ stockId: item.stockId, quantity: item.quantity })),
        stayId: modalMode === 'guest' ? selectedStayId : null,
        customerName: modalMode === 'external' ? externalName.trim() || undefined : undefined
      });
      closeSaleModal();
      const refreshed = await Promise.all([inventoryRequest(), staysActiveRequest(), salesRequest()]);
      const stockItems = refreshed[0];
      const staysData = refreshed[1];
      const salesData = refreshed[2];

      const mappedProducts = stockItems
        .filter((item) => item.quantity > 0)
        .map((item) => ({
          stockId: item.id,
          id: item.product.id,
          nombre: item.product.name,
          precio: Number(item.product.price),
          cantidadDisponible: item.quantity,
          categoria: item.product.category
        }));

      setProducts(mappedProducts);
      const mappedStays = staysData.filter((stay) => stay.status === 'ACTIVA').map((stay) => ({
        id: stay.id,
        roomNumber: stay.roomNumber,
        clientName: stay.client ? `${stay.client.firstName} ${stay.client.lastName}` : 'Huésped sin nombre',
        cc: stay.client?.cc ?? 'Sin cédula'
      }));
      setActiveStays(mappedStays);
      setSelectedStayId(mappedStays[0]?.id ?? null);
      setSales(
        salesData.map((sale) => ({
          id: sale.id,
          fecha: sale.date ?? new Date().toISOString(),
          producto: sale.product?.name ?? 'Producto',
          cantidad: sale.quantity,
          precioUnitario: Number(sale.unitPrice ?? 0),
          total: Number(sale.unitPrice ?? 0) * Number(sale.quantity ?? 0),
          tipoVenta: sale.stayId ? 'Huésped' : 'Externa',
          habitacion: sale.stay?.roomNumber,
          huesped: sale.stay?.client ? `${sale.stay.client.firstName} ${sale.stay.client.lastName}` : undefined,
          clienteExterno: sale.stayId ? undefined : 'Cliente externo'
        }))
      );
    } catch (err: any) {
      setError(err?.message || 'No se pudo registrar la venta.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-4">
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#eadfd6] bg-white p-4 shadow-[0_12px_28px_rgba(52,39,28,0.04)]">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f7efe8] text-[#2b1b14]">
            <ShoppingCart size={20} />
          </div>
          <div>
            <h2 className="text-[18px] font-bold text-[#2b1b14]">Ventas</h2>
            <p className="text-[11px] text-[#7d6d61]">Gestiona la venta de productos y consulta el historial de ventas.</p>
          </div>
        </div>
        <div className="hidden items-center gap-2 rounded-full border border-[#eadfd6] bg-[#fffaf5] px-3 py-1.5 text-[11px] font-medium text-[#4b2b21] sm:flex">
          <Sparkles size={14} className="text-[#946f2d]" />
          Panel de comercio
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-[#f1c2c2] bg-[#fff0f0] px-3 py-2 text-[11px] text-[#a23b3b]">
          {error}
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {summary.map((card) => (
          <SummaryCard key={card.label} label={card.label} value={card.value} icon={card.icon} tint={card.tint} />
        ))}
      </div>

      <section className="rounded-[26px] border border-[#eadfd6] bg-white p-4 shadow-[0_14px_36px_rgba(52,39,28,0.04)]">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-[15px] font-bold text-[#2b1b14]">Productos disponibles</h3>
            <p className="text-[11px] text-[#7d6d61]">Solo se muestran artículos con stock disponible.</p>
          </div>
          <div className="relative w-full max-w-md">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#7d6d61]" />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar producto..."
              className="w-full rounded-xl border border-[#eadfd6] bg-[#fffaf5] py-2.5 pl-9 pr-3 text-[12px] text-[#2b1b14] outline-none placeholder:text-[#9d8d85] focus:border-[#d7b778]"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-[180px] items-center justify-center rounded-2xl border border-dashed border-[#d8c7b8] bg-[#fffaf5] text-[12px] text-[#7d6d61]">
            Cargando productos reales...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex min-h-[180px] items-center justify-center rounded-2xl border border-dashed border-[#d8c7b8] bg-[#fffaf5] text-center text-[12px] text-[#7d6d61]">
            No se encontraron productos.
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {filteredProducts.map((product) => (
              <ProductCard key={product.stockId} product={product} onOpenModal={openSaleModal} />
            ))}
          </div>
        )}
      </section>

      <section className="rounded-[26px] border border-[#eadfd6] bg-white p-4 shadow-[0_14px_36px_rgba(52,39,28,0.04)]">
        <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-[15px] font-bold text-[#2b1b14]">Historial de ventas</h3>
            <p className="text-[11px] text-[#7d6d61]">Consulta ventas anteriores y filtra el registro.</p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-[#eadfd6] bg-[#fffaf5] px-2.5 py-1.5 text-[10px] font-medium text-[#4b2b21]">
            <CalendarRange size={13} />
            Ventas reales
          </div>
        </div>

        <div className="mb-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <div className="relative">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#7d6d61]" />
            <input
              type="text"
              value={historySearch}
              onChange={(event) => setHistorySearch(event.target.value)}
              placeholder="Buscar"
              className="w-full rounded-xl border border-[#eadfd6] bg-[#fffaf5] py-2 pl-8 pr-3 text-[12px] text-[#2b1b14] outline-none placeholder:text-[#9d8d85]"
            />
          </div>

          <select
            value={historyType}
            onChange={(event) => setHistoryType(event.target.value)}
            className="rounded-xl border border-[#eadfd6] bg-[#fffaf5] px-3 py-2 text-[12px] text-[#2b1b14] outline-none"
          >
            <option value="Todos">Todos</option>
            <option value="Huésped">Huésped</option>
            <option value="Externa">Externa</option>
          </select>

          <input
            type="date"
            value={historyDate}
            onChange={(event) => setHistoryDate(event.target.value)}
            className="rounded-xl border border-[#eadfd6] bg-[#fffaf5] px-3 py-2 text-[12px] text-[#2b1b14] outline-none"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-2 text-left">
            <thead>
              <tr className="text-[10px] uppercase tracking-[0.08em] text-[#7d6d61]">
                <th className="px-3 py-2 font-semibold">Fecha</th>
                <th className="px-3 py-2 font-semibold">Producto</th>
                <th className="px-3 py-2 font-semibold">Cantidad</th>
                <th className="px-3 py-2 font-semibold">Precio unit.</th>
                <th className="px-3 py-2 font-semibold">Total</th>
                <th className="px-3 py-2 font-semibold">Tipo</th>
                <th className="px-3 py-2 font-semibold">Destino</th>
              </tr>
            </thead>
            <tbody>
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center text-[12px] text-[#7d6d61]">
                    No hay ventas con los filtros actuales.
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => (
                  <tr key={sale.id} className="rounded-2xl bg-[#fdfaf7] text-[12px] text-[#2b1b14] shadow-sm ring-1 ring-[#f2e7e0]">
                    <td className="rounded-l-2xl px-3 py-3">{formatDate(sale.fecha)}</td>
                    <td className="px-3 py-3 font-medium">{sale.producto}</td>
                    <td className="px-3 py-3">{sale.cantidad}</td>
                    <td className="px-3 py-3">{currencyFormatter.format(sale.precioUnitario)}</td>
                    <td className="px-3 py-3 font-semibold">{currencyFormatter.format(sale.total)}</td>
                    <td className="px-3 py-3">{sale.tipoVenta}</td>
                    <td className="rounded-r-2xl px-3 py-3">
                      {sale.tipoVenta === 'Huésped' ? sale.habitacion || sale.huesped || 'Sin datos' : sale.clienteExterno || 'Cliente externo'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {modalMode && (
        <SaleModal
          mode={modalMode}
          cart={cart}
          setCart={setCart}
          availableProducts={products}
          activeStays={activeStays}
          selectedStayId={selectedStayId}
          setSelectedStayId={setSelectedStayId}
          externalName={externalName}
          setExternalName={setExternalName}
          onClose={closeSaleModal}
          onConfirm={handleConfirmSale}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}
