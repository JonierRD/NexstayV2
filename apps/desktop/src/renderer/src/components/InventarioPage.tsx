import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  RefreshCw,
  Edit2,
  Trash2,
  Boxes,
  MapPin,
  X
} from 'lucide-react';
import { type ReactElement, useCallback, useEffect, useMemo, useState } from 'react';
import {
  type PublicUser,
  type StockItem,
  inventoryRequest,
  createProductRequest,
  updateProductRequest,
  updateStockRequest,
  adjustInventoryQuantityRequest,
  deleteInventoryRequest
} from '../lib/api';
import { cn } from '../lib/utils';
import { Button } from './ui/button';
import { ConfirmModal } from './ConfirmModal';
import { AdminPasswordModal } from './AdminPasswordModal';
import { LoadingOverlay } from './LoadingOverlay';

const CATEGORIES = [
  { key: 'TODAS', label: 'Todas' },
  { key: 'BEBIDAS', label: 'Bebidas' },
  { key: 'SNACKS', label: 'Snacks & Mecato' },
  { key: 'ASEO', label: 'Aseo Personal' },
  { key: 'TIENDA', label: 'Tienda General' },
  { key: 'LENCERIA', label: 'Lencería y Blancos' },
  { key: 'OTROS', label: 'Otros' }
];

type InventarioPageProps = {
  user: PublicUser;
};

type ProductFormData = {
  name: string;
  category: string;
  price: number | '';
  description: string;
  quantity: number | '';
  minStock: number | '';
  location: string;
};

const INITIAL_FORM: ProductFormData = {
  name: '',
  category: 'BEBIDAS',
  price: '',
  description: '',
  quantity: 0,
  minStock: 5,
  location: ''
};

export function InventarioPage({ user }: InventarioPageProps): ReactElement {
  const [items, setItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filtros
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('TODAS');
  const [stockFilter, setStockFilter] = useState<'ALL' | 'NORMAL' | 'LOW' | 'OUT'>('ALL');

  // Modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);
  const [formData, setFormData] = useState<ProductFormData>(INITIAL_FORM);

  // Eliminación
  const [itemToDelete, setItemToDelete] = useState<StockItem | null>(null);
  const [showAdminAuthModal, setShowAdminAuthModal] = useState(false);

  // Cargar inventario
  const fetchInventory = useCallback(async () => {
    try {
      setError(null);
      const data = await inventoryRequest();
      setItems(data);
    } catch (err: any) {
      console.error('Error fetching inventory:', err);
      setError(err?.message || 'Error al cargar los artículos de inventario.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  // Limpiar mensajes temporales
  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  // Métricas calculadas
  const metrics = useMemo(() => {
    let totalItems = items.length;
    let normalCount = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let totalUnits = 0;
    let totalInventoryValue = 0;

    for (const item of items) {
      totalUnits += item.quantity;
      const price = Number(item.product?.price || 0);
      totalInventoryValue += item.quantity * price;

      if (item.quantity === 0) {
        outOfStockCount++;
      } else if (item.quantity <= item.minStock) {
        lowStockCount++;
      } else {
        normalCount++;
      }
    }

    return {
      totalItems,
      normalCount,
      lowStockCount,
      outOfStockCount,
      totalUnits,
      totalInventoryValue
    };
  }, [items]);

  // Lista filtrada
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const p = item.product;
      const matchesSearch =
        search === '' ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(search.toLowerCase())) ||
        (item.location && item.location.toLowerCase().includes(search.toLowerCase()));

      const matchesCat =
        selectedCategory === 'TODAS' ||
        (p.category || 'TIENDA').toUpperCase() === selectedCategory.toUpperCase();

      let matchesStock = true;
      if (stockFilter === 'NORMAL') {
        matchesStock = item.quantity > item.minStock;
      } else if (stockFilter === 'LOW') {
        matchesStock = item.quantity > 0 && item.quantity <= item.minStock;
      } else if (stockFilter === 'OUT') {
        matchesStock = item.quantity === 0;
      }

      return matchesSearch && matchesCat && matchesStock;
    });
  }, [items, search, selectedCategory, stockFilter]);

  // Manejo de abrir modal (Nuevo o Editar)
  function handleOpenCreateModal() {
    setEditingItem(null);
    setFormData(INITIAL_FORM);
    setIsModalOpen(true);
  }

  function handleOpenEditModal(item: StockItem) {
    setEditingItem(item);
    setFormData({
      name: item.product.name,
      category: item.product.category || 'TIENDA',
      price: Number(item.product.price),
      description: item.product.description || '',
      quantity: item.quantity,
      minStock: item.minStock,
      location: item.location || ''
    });
    setIsModalOpen(true);
  }

  // Guardar Producto
  async function handleSaveProduct(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('El nombre del producto es obligatorio.');
      return;
    }
    if (formData.price === '' || Number(formData.price) < 0) {
      setError('El precio unitario no puede ser negativo.');
      return;
    }

    try {
      setActionLoading(editingItem ? 'Actualizando producto...' : 'Guardando nuevo producto...');
      setError(null);

      if (editingItem) {
        // Actualizar producto
        await updateProductRequest(editingItem.product.id, {
          name: formData.name.trim(),
          category: formData.category,
          price: Number(formData.price),
          description: formData.description.trim() || undefined
        });

        // Actualizar stock (minStock, quantity, location)
        await updateStockRequest(editingItem.id, {
          quantity: formData.quantity === '' ? 0 : Number(formData.quantity),
          minStock: formData.minStock === '' ? 0 : Number(formData.minStock),
          location: formData.location.trim() || undefined
        });

        setSuccessMsg(`Producto "${formData.name}" actualizado exitosamente.`);
      } else {
        // Crear producto
        const newProd = await createProductRequest({
          name: formData.name.trim(),
          category: formData.category,
          price: Number(formData.price),
          description: formData.description.trim() || undefined
        });

        // Si se especificó stock o ubicación inicial, actualizar el stock creado
        if (
          (formData.quantity !== '' && Number(formData.quantity) > 0) ||
          (formData.minStock !== '' && Number(formData.minStock) > 0) ||
          formData.location.trim()
        ) {
          // Refrescar para obtener el stock id o actualizar después
          const latestItems = await inventoryRequest();
          const createdStock = latestItems.find((s) => s.productId === newProd.id);
          if (createdStock) {
            await updateStockRequest(createdStock.id, {
              quantity: formData.quantity === '' ? 0 : Number(formData.quantity),
              minStock: formData.minStock === '' ? 0 : Number(formData.minStock),
              location: formData.location.trim() || undefined
            });
          }
        }

        setSuccessMsg(`Producto "${formData.name}" registrado exitosamente.`);
      }

      setIsModalOpen(false);
      await fetchInventory();
    } catch (err: any) {
      console.error('Error saving product:', err);
      setError(err?.message || 'Error al guardar el producto.');
    } finally {
      setActionLoading(null);
    }
  }

  // Ajuste rápido de unidades (+ o -)
  async function handleQuickAdjust(item: StockItem, delta: number) {
    if (delta < 0 && item.quantity <= 0) return;

    try {
      const operation = delta > 0 ? 'ADD' : 'SUBTRACT';
      const quantity = Math.abs(delta);

      // Actualización optimista inmediata
      setItems((prev) =>
        prev.map((it) =>
          it.id === item.id
            ? {
                ...it,
                quantity: operation === 'ADD' ? it.quantity + quantity : Math.max(0, it.quantity - quantity)
              }
            : it
        )
      );

      await adjustInventoryQuantityRequest(item.id, quantity, operation);
    } catch (err: any) {
      console.error('Error adjusting inventory:', err);
      setError('Error al ajustar la cantidad en inventario.');
      await fetchInventory(); // Revertir en caso de error
    }
  }

  // Inicio de eliminación
  function handleDeleteClick(item: StockItem) {
    setItemToDelete(item);
    if (user.role !== 'ADMIN') {
      setShowAdminAuthModal(true);
    }
  }

  // Ejecución de eliminación tras confirmación
  async function handleConfirmDelete() {
    if (!itemToDelete) return;
    try {
      setActionLoading('Eliminando producto del catálogo...');
      await deleteInventoryRequest(itemToDelete.id);
      setSuccessMsg(`El producto "${itemToDelete.product.name}" ha sido eliminado.`);
      setItemToDelete(null);
      await fetchInventory();
    } catch (err: any) {
      console.error('Error deleting product:', err);
      setError(err?.message || 'Error al eliminar el producto de inventario.');
    } finally {
      setActionLoading(null);
    }
  }

  // Helpers de estado visual
  function getStockStatusBadge(quantity: number, minStock: number) {
    if (quantity === 0) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-[#f0c8c4] bg-[#fff0ee] px-2.5 py-0.5 text-[10px] font-semibold text-[#c94a43]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#c94a43] animate-pulse" />
          Agotado
        </span>
      );
    }
    if (quantity <= minStock) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-[#f2dbab] bg-[#fff5df] px-2.5 py-0.5 text-[10px] font-semibold text-[#c78b14]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#c78b14]" />
          Stock Bajo ({quantity} de mín. {minStock})
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-[#c6e8cf] bg-[#e9f6eb] px-2.5 py-0.5 text-[10px] font-semibold text-[#2f8f4e]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#2f8f4e]" />
        Disponible
      </span>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-[#fbf8f4] p-5">
      {actionLoading && <LoadingOverlay message={actionLoading} />}

      {/* Header Principal */}
      <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-[#2b1b14]">Inventario</h1>
            <span className="rounded-full bg-[#eadfd6] px-2.5 py-0.5 text-[11px] font-semibold text-[#4b2b21]">
              {items.length} {items.length === 1 ? 'artículo' : 'artículos'}
            </span>
          </div>
          <p className="text-[12px] text-[#7d6d61]">
            Control de existencias, suministros, mecato y bebidas para huéspedes y recepción.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={fetchInventory}
            disabled={loading}
            className="flex h-9 items-center gap-1.5 rounded-xl border border-[#dccfca] bg-white px-3 text-[12px] font-medium text-[#4b2b21] hover:bg-[#faf6f2] shadow-sm"
          >
            <RefreshCw size={14} className={cn(loading && 'animate-spin')} />
            Actualizar
          </Button>

          <Button
            onClick={handleOpenCreateModal}
            className="flex h-9 items-center gap-1.5 rounded-xl bg-[#4b2b21] px-4 text-[12px] font-medium text-white hover:bg-[#5a3429] shadow-sm transition"
          >
            <Plus size={16} />
            Nuevo Producto
          </Button>
        </div>
      </div>

      {/* Mensajes de Alerta / Éxito */}
      {error && (
        <div className="mb-4 flex items-center justify-between rounded-xl border border-[#f0c8c4] bg-[#fff0ee] px-4 py-3 text-[12px] text-[#c94a43]">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-[#c94a43] hover:opacity-80">
            <X size={14} />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="mb-4 flex items-center justify-between rounded-xl border border-[#c6e8cf] bg-[#e9f6eb] px-4 py-3 text-[12px] text-[#2f8f4e]">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-[#2f8f4e] hover:opacity-80">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Tarjetas de Métricas Ejecutivas Compactas */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* Total Productos */}
        <div className="rounded-2xl border border-[#eadfd6] bg-white p-3 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-[#7d6d61]">Total Productos</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#faf6f2] text-[#4b2b21]">
              <Boxes size={14} />
            </div>
          </div>
          <p className="mt-1.5 text-xl font-bold text-[#2b1b14]">{metrics.totalItems}</p>
          <p className="text-[10px] text-[#7d6d61]">{metrics.totalUnits} unidades en stock</p>
        </div>

        {/* Stock Normal */}
        <div
          onClick={() => setStockFilter(stockFilter === 'NORMAL' ? 'ALL' : 'NORMAL')}
          className={cn(
            'cursor-pointer rounded-2xl border p-3 transition shadow-sm',
            stockFilter === 'NORMAL'
              ? 'border-[#2f8f4e] bg-[#f2faf3]'
              : 'border-[#eadfd6] bg-white hover:border-[#c6e8cf]'
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-[#2f8f4e]">Stock Normal</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#e9f6eb] text-[#2f8f4e]">
              <CheckCircle2 size={14} />
            </div>
          </div>
          <p className="mt-1.5 text-xl font-bold text-[#2f8f4e]">{metrics.normalCount}</p>
          <p className="text-[10px] text-[#2f8f4e]/80">Existencias óptimas</p>
        </div>

        {/* Stock Bajo / Alerta */}
        <div
          onClick={() => setStockFilter(stockFilter === 'LOW' ? 'ALL' : 'LOW')}
          className={cn(
            'cursor-pointer rounded-2xl border p-3 transition shadow-sm',
            stockFilter === 'LOW'
              ? 'border-[#c78b14] bg-[#fffbf2]'
              : 'border-[#eadfd6] bg-white hover:border-[#f2dbab]'
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-[#c78b14]">Stock Crítico</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#fff5df] text-[#c78b14]">
              <AlertTriangle size={14} />
            </div>
          </div>
          <p className="mt-1.5 text-xl font-bold text-[#c78b14]">{metrics.lowStockCount}</p>
          <p className="text-[10px] text-[#c78b14]/80">Cerca del mín.</p>
        </div>

        {/* Agotados */}
        <div
          onClick={() => setStockFilter(stockFilter === 'OUT' ? 'ALL' : 'OUT')}
          className={cn(
            'cursor-pointer rounded-2xl border p-3 transition shadow-sm',
            stockFilter === 'OUT'
              ? 'border-[#c94a43] bg-[#fff5f5]'
              : 'border-[#eadfd6] bg-white hover:border-[#f0c8c4]'
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-[#c94a43]">Agotados</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#fff0ee] text-[#c94a43]">
              <TrendingDown size={14} />
            </div>
          </div>
          <p className="mt-1.5 text-xl font-bold text-[#c94a43]">{metrics.outOfStockCount}</p>
          <p className="text-[10px] text-[#c94a43]/80">Sin existencias</p>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="mb-4 flex flex-col gap-3 rounded-[18px] border border-[#eadfd6] bg-white p-3.5 shadow-[0_10px_30px_rgba(67,42,27,0.04)] sm:flex-row sm:items-center sm:justify-between">
        {/* Buscador */}
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8d7b70]" />
          <input
            type="text"
            placeholder="Buscar por nombre, descripción o ubicación..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full rounded-xl border border-[#e0d4ca] bg-[#fcfaf8] pl-9 pr-3 text-[12px] text-[#2b1b14] outline-none transition placeholder:text-[#a49486] focus:border-[#b08f7c] focus:bg-white"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8d7b70] hover:text-[#4b2b21]"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Selector de Categorías */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key)}
              className={cn(
                'whitespace-nowrap rounded-xl px-3 py-1.5 text-[11px] font-medium transition',
                selectedCategory === cat.key
                  ? 'bg-[#4b2b21] text-white shadow-sm'
                  : 'bg-[#faf6f2] text-[#6d5d52] hover:bg-[#f2eae4] hover:text-[#4b2b21]'
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Lista / Tabla de Productos estilo Excel */}
      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-[20px] border border-dashed border-[#eadfd6] bg-white">
          <div className="flex flex-col items-center gap-2 text-[#7d6d61]">
            <RefreshCw size={24} className="animate-spin text-[#4b2b21]" />
            <p className="text-[12px] font-medium">Cargando inventario...</p>
          </div>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-[20px] border border-dashed border-[#eadfd6] bg-white p-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#faf6f2] text-[#4b2b21]">
            <Package size={22} />
          </div>
          <h3 className="mt-3 text-[14px] font-semibold text-[#2b1b14]">No se encontraron artículos</h3>
          <p className="mt-1 max-w-sm text-[11px] text-[#7d6d61]">
            {search || selectedCategory !== 'TODAS' || stockFilter !== 'ALL'
              ? 'No hay productos que coincidan con los filtros aplicados. Intenta restablecer la búsqueda.'
              : 'El catálogo de inventario está vacío. Comienza registrando tu primer producto.'}
          </p>
          {(search || selectedCategory !== 'TODAS' || stockFilter !== 'ALL') && (
            <Button
              onClick={() => {
                setSearch('');
                setSelectedCategory('TODAS');
                setStockFilter('ALL');
              }}
              className="mt-4 h-8 rounded-xl border border-[#dccfca] bg-white px-3 text-[11px] text-[#4b2b21] hover:bg-[#faf6f2]"
            >
              Restablecer filtros
            </Button>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[#eadfd6] bg-white shadow-[0_10px_30px_rgba(67,42,27,0.04)]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] border-collapse text-left">
              <thead>
                <tr className="border-b border-[#eadfd6] bg-[#faf6f2] text-[11px] font-bold uppercase tracking-wider text-[#6e584a]">
                  <th className="py-3 px-4">Producto</th>
                  <th className="py-3 px-3">Categoría</th>
                  <th className="py-3 px-3">Ubicación</th>
                  <th className="py-3 px-3 text-right">Precio Venta</th>
                  <th className="py-3 px-3 text-center">Stock / Mín</th>
                  <th className="py-3 px-3 text-center">Estado</th>
                  <th className="py-3 px-3 text-center">Ajuste Rápido</th>
                  <th className="py-3 px-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0e6de] text-[12px] text-[#2b1b14]">
                {filteredItems.map((item) => {
                  const prod = item.product;
                  const price = Number(prod.price || 0);
                  const isOutOfStock = item.quantity === 0;

                  return (
                    <tr
                      key={item.id}
                      className={cn(
                        'transition-colors duration-150 hover:bg-[#fcfaf8]',
                        isOutOfStock && 'bg-[#fffafa]'
                      )}
                    >
                      {/* Producto: Nombre y descripción */}
                      <td className="py-3 px-4 align-middle">
                        <div className="flex flex-col">
                          <span className="font-bold text-[#2b1b14]">{prod.name}</span>
                          {prod.description ? (
                            <span className="line-clamp-1 text-[11px] text-[#7d6d61]">{prod.description}</span>
                          ) : (
                            <span className="text-[10px] italic text-[#a49486]">Sin descripción</span>
                          )}
                        </div>
                      </td>

                      {/* Categoría */}
                      <td className="py-3 px-3 align-middle">
                        <span className="inline-block rounded-lg bg-[#faf6f2] border border-[#f0e6de] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#6e584a]">
                          {prod.category || 'TIENDA'}
                        </span>
                      </td>

                      {/* Ubicación */}
                      <td className="py-3 px-3 align-middle text-[#7d6d61]">
                        {item.location ? (
                          <div className="flex items-center gap-1 text-[11px]">
                            <MapPin size={12} className="text-[#a49486] shrink-0" />
                            <span>{item.location}</span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-[#b4a497]">-</span>
                        )}
                      </td>

                      {/* Precio Venta */}
                      <td className="py-3 px-3 align-middle text-right font-extrabold text-[#4b2b21]">
                        ${price.toLocaleString('es-CO')}
                      </td>

                      {/* Existencias / Mínimo */}
                      <td className="py-3 px-3 align-middle text-center">
                        <span className="font-bold text-[#2b1b14]">{item.quantity}</span>
                        <span className="text-[10px] text-[#8d7b70] ml-1">/ mín {item.minStock}</span>
                      </td>

                      {/* Estado Badge */}
                      <td className="py-3 px-3 align-middle text-center">
                        {getStockStatusBadge(item.quantity, item.minStock)}
                      </td>

                      {/* Ajuste Rápido */}
                      <td className="py-3 px-3 align-middle text-center">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            disabled={item.quantity <= 0}
                            onClick={() => handleQuickAdjust(item, -1)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#dccfca] bg-white text-[11px] font-bold text-[#4b2b21] transition hover:bg-[#fff0ee] hover:border-[#f0c8c4] hover:text-[#c94a43] disabled:opacity-30 disabled:pointer-events-none"
                            title="Restar 1 unidad"
                          >
                            -1
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickAdjust(item, 1)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#dccfca] bg-white text-[11px] font-bold text-[#4b2b21] transition hover:bg-[#e9f6eb] hover:border-[#c6e8cf] hover:text-[#2f8f4e]"
                            title="Sumar 1 unidad"
                          >
                            +1
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickAdjust(item, 5)}
                            className="flex h-7 px-2 items-center justify-center rounded-lg border border-[#dccfca] bg-[#faf6f2] text-[10px] font-bold text-[#4b2b21] transition hover:bg-[#e9f6eb] hover:border-[#c6e8cf] hover:text-[#2f8f4e]"
                            title="Sumar 5 unidades"
                          >
                            +5
                          </button>
                        </div>
                      </td>

                      {/* Acciones */}
                      <td className="py-3 px-3 align-middle text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(item)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#dccfca] bg-white text-[#7d6d61] hover:border-[#b08f7c] hover:text-[#4b2b21] hover:bg-[#faf6f2] transition"
                            title="Editar producto"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteClick(item)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#f0c8c4] bg-white text-[#c94a43] hover:bg-[#fff0ee] transition"
                            title="Eliminar producto"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* Footer tipo hoja de cálculo con resumen de registros */}
          <div className="flex flex-col sm:flex-row items-center justify-between border-t border-[#eadfd6] bg-[#faf6f2] px-4 py-2 text-[11px] text-[#7d6d61] gap-1">
            <span>
              Mostrando <strong className="text-[#2b1b14]">{filteredItems.length}</strong> de <strong className="text-[#2b1b14]">{items.length}</strong> productos
            </span>
            <span>
              Valor en stock filtrado: <strong className="text-[#4b2b21]">${filteredItems.reduce((acc, it) => acc + it.quantity * Number(it.product.price || 0), 0).toLocaleString('es-CO')}</strong>
            </span>
          </div>
        </div>
      )}

      {/* Modal Crear / Editar Producto */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-[480px] rounded-[24px] border border-[#eadfd6] bg-white p-6 shadow-[0_30px_80px_rgba(0,0,0,0.25)]">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 text-[#8d7b70] hover:text-[#4b2b21] transition"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#faf6f2] text-[#4b2b21] border border-[#eadfd6]">
                <Package size={20} />
              </div>
              <div>
                <h3 className="text-[16px] font-bold text-[#2b1b14]">
                  {editingItem ? 'Editar Producto' : 'Nuevo Producto en Catálogo'}
                </h3>
                <p className="text-[11px] text-[#7d6d61]">
                  {editingItem
                    ? 'Actualiza los datos de venta y stock del artículo.'
                    : 'Ingresa los detalles para registrar un nuevo producto en tienda.'}
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveProduct} className="mt-5 space-y-3.5">
              {/* Nombre */}
              <div>
                <label className="mb-1 block text-[11px] font-bold text-[#4b2b21]">
                  Nombre del Producto *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Agua Mineral 600ml, Papas Fritas..."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="h-9 w-full rounded-xl border border-[#e0d4ca] bg-[#fcfaf8] px-3 text-[12px] text-[#2b1b14] outline-none transition placeholder:text-[#a49486] focus:border-[#b08f7c] focus:bg-white"
                  autoFocus
                />
              </div>

              {/* Categoría y Precio en fila */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[11px] font-bold text-[#4b2b21]">
                    Categoría *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="h-9 w-full rounded-xl border border-[#e0d4ca] bg-[#fcfaf8] px-3 text-[12px] text-[#2b1b14] outline-none transition focus:border-[#b08f7c] focus:bg-white"
                  >
                    <option value="BEBIDAS">Bebidas</option>
                    <option value="SNACKS">Snacks & Mecato</option>
                    <option value="ASEO">Aseo Personal</option>
                    <option value="TIENDA">Tienda General</option>
                    <option value="LENCERIA">Lencería</option>
                    <option value="OTROS">Otros</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-bold text-[#4b2b21]">
                    Precio Unitario ($) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    required
                    placeholder="Ej: 3000"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        price: e.target.value === '' ? '' : Number(e.target.value)
                      })
                    }
                    className="h-9 w-full rounded-xl border border-[#e0d4ca] bg-[#fcfaf8] px-3 text-[12px] text-[#2b1b14] outline-none transition placeholder:text-[#a49486] focus:border-[#b08f7c] focus:bg-white font-medium"
                  />
                </div>
              </div>

              {/* Stock y Stock Mínimo */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[11px] font-bold text-[#4b2b21]">
                    {editingItem ? 'Cantidad Actual' : 'Stock Inicial'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        quantity: e.target.value === '' ? '' : Number(e.target.value)
                      })
                    }
                    className="h-9 w-full rounded-xl border border-[#e0d4ca] bg-[#fcfaf8] px-3 text-[12px] text-[#2b1b14] outline-none transition focus:border-[#b08f7c] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-bold text-[#4b2b21]">
                    Alerta Stock Mínimo
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Ej: 5"
                    value={formData.minStock}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        minStock: e.target.value === '' ? '' : Number(e.target.value)
                      })
                    }
                    className="h-9 w-full rounded-xl border border-[#e0d4ca] bg-[#fcfaf8] px-3 text-[12px] text-[#2b1b14] outline-none transition focus:border-[#b08f7c] focus:bg-white"
                  />
                </div>
              </div>

              {/* Ubicación */}
              <div>
                <label className="mb-1 block text-[11px] font-bold text-[#4b2b21]">
                  Ubicación en Almacén / Vitrina (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ej: Nevera 1, Estante B2, Recepción..."
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="h-9 w-full rounded-xl border border-[#e0d4ca] bg-[#fcfaf8] px-3 text-[12px] text-[#2b1b14] outline-none transition placeholder:text-[#a49486] focus:border-[#b08f7c] focus:bg-white"
                />
              </div>

              {/* Descripción */}
              <div>
                <label className="mb-1 block text-[11px] font-bold text-[#4b2b21]">
                  Descripción o Notas (Opcional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Detalles sobre presentación, sabor o tamaño..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-xl border border-[#e0d4ca] bg-[#fcfaf8] p-2.5 text-[12px] text-[#2b1b14] outline-none transition placeholder:text-[#a49486] focus:border-[#b08f7c] focus:bg-white resize-none"
                />
              </div>

              {/* Botones de acción */}
              <div className="mt-6 flex gap-2 pt-2">
                <Button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 h-9 rounded-xl border border-[#dccfca] bg-white text-[12px] font-medium text-[#4b2b21] hover:bg-[#faf6f2]"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="flex-1 h-9 rounded-xl bg-[#4b2b21] text-[12px] font-medium text-white hover:bg-[#5a3429]"
                >
                  {editingItem ? 'Guardar Cambios' : 'Registrar Producto'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Eliminación */}
      {itemToDelete && !showAdminAuthModal && (
        <ConfirmModal
          title="¿Eliminar producto de inventario?"
          message={`¿Estás seguro de que deseas eliminar permanentemente "${itemToDelete.product.name}"? Esta acción borrará el registro de stock y del catálogo.`}
          confirmLabel="Eliminar producto"
          confirmDanger
          onConfirm={handleConfirmDelete}
          onClose={() => setItemToDelete(null)}
        />
      )}

      {/* Modal de Autorización de Administrador si no es Admin */}
      {showAdminAuthModal && (
        <AdminPasswordModal
          onSuccess={() => {
            setShowAdminAuthModal(false);
            handleConfirmDelete();
          }}
          onClose={() => {
            setShowAdminAuthModal(false);
            setItemToDelete(null);
          }}
        />
      )}
    </div>
  );
}
