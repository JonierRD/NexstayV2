import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  type StockItem,
  inventoryRequest,
  createProductRequest,
  updateProductRequest,
  updateStockRequest,
  adjustInventoryQuantityRequest,
  deleteInventoryRequest
} from '../../lib/api';
import { INITIAL_FORM, type ProductFormData, type StockFilter } from './types';

export function useInventario(isAdmin: boolean) {
  const [items, setItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filtros
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('TODAS');
  const [stockFilter, setStockFilter] = useState<StockFilter>('ALL');

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

  function closeModal() {
    setIsModalOpen(false);
    setEditingItem(null);
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
    if (!isAdmin) {
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

  return {
    items,
    filteredItems,
    metrics,
    loading,
    actionLoading,
    error,
    successMsg,
    setError,
    setSuccessMsg,
    search,
    setSearch,
    selectedCategory,
    setSelectedCategory,
    stockFilter,
    setStockFilter,
    isModalOpen,
    editingItem,
    formData,
    setFormData,
    itemToDelete,
    setItemToDelete,
    showAdminAuthModal,
    setShowAdminAuthModal,
    openCreateModal: handleOpenCreateModal,
    openEditModal: handleOpenEditModal,
    closeModal,
    saveProduct: handleSaveProduct,
    quickAdjust: handleQuickAdjust,
    requestDelete: handleDeleteClick,
    confirmDelete: handleConfirmDelete,
    fetchInventory
  };
}