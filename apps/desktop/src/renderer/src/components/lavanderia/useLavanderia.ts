import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  type Laundry,
  type LaundryPayload,
  createLaundryRequest,
  deleteLaundryRequest,
  laundryRequest,
  updateLaundryRequest
} from '../../lib/api';
import {
  type LaundryItemType,
  type LaundryStatus,
  itemPluralLabels,
  parseLaundryItemCounts
} from './types';
import { useConfirmDialog } from '../ui/useConfirmDialog';

export function useLavanderia() {
  // Estado de la página (listado, filtros, selección, modales)
  const [orders, setOrders] = useState<Laundry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<LaundryStatus | 'TODOS'>('TODOS');
  const [itemFilter, setItemFilter] = useState<LaundryItemType | 'TODOS'>('TODOS');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Laundry | null>(null);
  const {
    showConfirm,
    confirmAction,
    confirmTitle,
    confirmMessage,
    confirm,
    closeConfirm
  } = useConfirmDialog();

  // PROCESO: Cargar el listado de órdenes desde la API (GET /laundry)
  // `selectedIdRef` evita depender del estado: si no, cada cambio de selección
  // disparaba otra carga y el efecto inicial necesitaba el eslint-disable.
  const selectedIdRef = useRef<number | null>(selectedId);
  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  const loadOrders = useCallback(() => {
    setLoading(true);
    laundryRequest()
      .then((data) => {
        setOrders(data);
        const current = selectedIdRef.current;
        if (data.length > 0 && !data.find((o) => o.id === current)) {
          setSelectedId(data[0].id);
        }
      })
      .catch((error) => console.error('Error loading laundry orders:', error))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // PROCESO: Búsqueda y filtros por estado y prenda
  const filteredOrders = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesSearch =
        !normalizedSearch ||
        order.clientName.toLowerCase().includes(normalizedSearch) ||
        order.description.toLowerCase().includes(normalizedSearch) ||
        (order.roomNumber ?? '').toLowerCase().includes(normalizedSearch);

      const matchesStatus = statusFilter === 'TODOS' || order.status === statusFilter;
      const matchesItem =
        itemFilter === 'TODOS' ||
        order.item === itemFilter ||
        order.description.toLowerCase().includes(itemPluralLabels[itemFilter].toLowerCase());

      return matchesSearch && matchesStatus && matchesItem;
    });
  }, [orders, search, statusFilter, itemFilter]);

  const selectedOrder = filteredOrders.find((o) => o.id === selectedId) ?? filteredOrders[0];

  async function repriceOrders(prices: Record<LaundryItemType, number>): Promise<void> {
    const updatedOrders = await Promise.all(orders.map((order) => {
      const counts = parseLaundryItemCounts(
        order.description,
        order.item as LaundryItemType,
        order.quantity
      );
      const totalPrice = Object.entries(counts).reduce(
        (total, [item, count]) => total + count * prices[item as LaundryItemType],
        0
      );
      return updateLaundryRequest(order.id, {
        unitPrice: Math.round(totalPrice / order.quantity),
        totalPrice
      });
    }));
    setOrders(updatedOrders);
  }

  // PROCESO: Cálculo de estadísticas (totales por estado)
  const stats = useMemo(
    () => ({
      total: orders.length,
      pendientes: orders.filter((o) => o.status === 'PENDIENTE').length,
      enProceso: orders.filter((o) => o.status === 'EN_PROCESO').length,
      listos: orders.filter((o) => o.status === 'LISTO').length
    }),
    [orders]
  );

  // PROCESO: Avanzar el estado de la orden (PENDIENTE → EN_PROCESO → LISTO → ENTREGADO)
  function handleAdvanceStatus(order: Laundry) {
    const next: Partial<Record<LaundryStatus, LaundryStatus>> = {
      PENDIENTE: 'EN_PROCESO',
      EN_PROCESO: 'LISTO',
      LISTO: 'ENTREGADO'
    };
    const nextStatus = next[order.status as LaundryStatus];
    if (!nextStatus) return;

    updateLaundryRequest(order.id, { status: nextStatus })
      .then(() => loadOrders())
      .catch((error) => console.error('Error updating status:', error));
  }

  // PROCESO: Solicitar eliminacion. El backend de lavanderia no exige contrasena de admin.
  function requestDelete(id: number) {
    confirmDelete(id);
  }

  // PROCESO: Confirmar y eliminar la orden (DELETE /laundry/:id)
  function confirmDelete(id: number) {
    showConfirm({
        title: '¿Eliminar esta orden de lavandería?',
        message: 'Esta acción no se puede deshacer.',
        onConfirm: () => {
          deleteLaundryRequest(id)
            .then(() => loadOrders())
            .catch((error) => console.error('Error deleting order:', error));
        }
      });
  }

  function openCreateForm() {
    setEditingOrder(null);
    setShowForm(true);
  }

  function openEditForm(order: Laundry) {
    setEditingOrder(order);
    setShowForm(true);
  }

  // PROCESO: Crear o actualizar la orden. La ejecuta el modal, no él mismo.
  async function submitOrder(payload: LaundryPayload): Promise<void> {
    if (editingOrder) {
      await updateLaundryRequest(editingOrder.id, payload);
    } else {
      await createLaundryRequest(payload);
    }
    onFormSaved();
  }

  function onFormSaved() {
    setShowForm(false);
    setEditingOrder(null);
    loadOrders();
  }

  function closeForm() {
    setShowForm(false);
    setEditingOrder(null);
  }

  return {
    loading,
    filteredOrders,
    selectedOrder,
    repriceOrders,
    stats,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    itemFilter,
    setItemFilter,
    selectedId,
    setSelectedId,
    showForm,
    editingOrder,
    openCreateForm,
    openEditForm,
    submitOrder,
    closeForm,
    requestDelete,
    handleAdvanceStatus,
    confirmAction,
    confirmTitle,
    confirmMessage,
    confirm,
    closeConfirm
  };
}
