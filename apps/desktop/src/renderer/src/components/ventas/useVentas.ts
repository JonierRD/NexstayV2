import { CircleDollarSign, PackageCheck, ShoppingCartIcon, Users } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ApiError,
  createSalesRequest,
  inventoryRequest,
  salesRequest,
  staysActiveRequest,
  type Stay,
  type StaySale,
  type StockItem
} from '../../lib/api';
import { type CartItem, type Product, type SaleMode, type SaleRecord, currencyFormatter } from './types';

type ActiveStay = { id: number; roomNumber: string; clientName: string; cc: string };

function mapProducts(stockItems: StockItem[]): Product[] {
  return stockItems
    .filter((item) => item.quantity > 0)
    .map((item) => ({
      stockId: item.id,
      id: item.product.id,
      nombre: item.product.name,
      precio: Number(item.product.price),
      cantidadDisponible: item.quantity,
      categoria: item.product.category
    }));
}

function mapStays(staysData: Stay[]): ActiveStay[] {
  return staysData
    .filter((stay) => stay.status === 'ACTIVA')
    .map((stay) => ({
      id: stay.id,
      roomNumber: stay.roomNumber,
      clientName: stay.client ? `${stay.client.firstName} ${stay.client.lastName}` : 'Huésped sin nombre',
      cc: stay.client?.cc ?? 'Sin cédula'
    }));
}

function mapSales(salesData: StaySale[]): SaleRecord[] {
  return salesData.map((sale) => ({
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
}

function buildErrorMessage(err: unknown): string {
  const message =
    err instanceof ApiError
      ? err.message
      : err instanceof Error
        ? err.message
        : 'No se pudo cargar la información real del módulo de ventas.';

  if (message.toLowerCase().includes('401') || message.toLowerCase().includes('unauthorized')) {
    return 'La sesión ha expirado o no tienes permiso para ver este módulo. Inicia sesión nuevamente.';
  }
  if (
    message.toLowerCase().includes('fetch') ||
    message.toLowerCase().includes('network') ||
    message.toLowerCase().includes('failed to fetch')
  ) {
    return 'No se pudo conectar con la API de SAPAY. Verifica que el backend esté ejecutándose.';
  }
  return message;
}

async function loadAllData() {
  const [stockItems, staysData, salesData] = await Promise.all([
    inventoryRequest(),
    staysActiveRequest(),
    salesRequest()
  ]);
  return { products: mapProducts(stockItems), stays: mapStays(staysData), sales: mapSales(salesData) };
}

export function useVentas() {
  const [products, setProducts] = useState<Product[]>([]);
  const [activeStays, setActiveStays] = useState<ActiveStay[]>([]);
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

        const data = await loadAllData();

        setProducts(data.products);
        setActiveStays(data.stays);
        setSelectedStayId(data.stays[0]?.id ?? null);
        setSales(data.sales);
      } catch (err) {
        console.error('[VentasPage] No se pudo cargar la información real del módulo de ventas:', err);
        setError(buildErrorMessage(err));
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

  const openSaleModal = useCallback((product: Product, mode: SaleMode) => {
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
  }, [activeStays]);

  const closeSaleModal = useCallback(() => {
    setModalMode(null);
    setCart([]);
    setExternalName('');
  }, []);

  const handleConfirmSale = useCallback(async () => {
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
      const data = await loadAllData();
      setProducts(data.products);
      setActiveStays(data.stays);
      setSelectedStayId(data.stays[0]?.id ?? null);
      setSales(data.sales);
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : 'No se pudo registrar la venta.');
    } finally {
      setIsSubmitting(false);
    }
  }, [cart, closeSaleModal, externalName, modalMode, selectedStayId]);

  return {
    products,
    activeStays,
    sales,
    search,
    setSearch,
    historySearch,
    setHistorySearch,
    historyType,
    setHistoryType,
    historyDate,
    setHistoryDate,
    modalMode,
    cart,
    setCart,
    selectedStayId,
    setSelectedStayId,
    externalName,
    setExternalName,
    isSubmitting,
    loading,
    error,
    filteredProducts,
    summary,
    filteredSales,
    openSaleModal,
    closeSaleModal,
    handleConfirmSale
  };
}