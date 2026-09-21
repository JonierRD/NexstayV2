import { useCallback, useEffect, useState } from 'react';
import {
  type Laundry,
  type PublicUser,
  deleteLaundryRequest,
  laundryRequest,
  updateLaundryRequest
} from '../../lib/api';
import { type LaundryItemType, type LaundryStatus } from './types';

export function useLavanderia({ user }: { user: PublicUser }) {
  // Estado de la página (listado, filtros, selección, modales)
  const [orders, setOrders] = useState<Laundry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<LaundryStatus | 'TODOS'>('TODOS');
  const [itemFilter, setItemFilter] = useState<LaundryItemType | 'TODOS'>('TODOS');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Laundry | null>(null);
  const [showAdminAuth, setShowAdminAuth] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');

  const isAdmin = user.role === 'ADMIN';

  // PROCESO: Cargar el listado de órdenes desde la API (GET /laundry)
  const loadOrders = useCallback(() => {
    setLoading(true);
    laundryRequest()
      .then((data) => {
        setOrders(data);
        if (data.length > 0 && !data.find((o) => o.id === selectedId)) {
          setSelectedId(data[0].id);
        }
      })
      .catch((error) => console.error('Error loading laundry orders:', error))
      .finally(() => setLoading(false));
  }, [selectedId]);

  useEffect(() => {
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // PROCESO: Búsqueda y filtros por estado y prenda
  const filteredOrders = orders.filter((order) => {
    const normalizedSearch = search.trim().toLowerCase();
    const matchesSearch =
      !normalizedSearch ||
      order.clientName.toLowerCase().includes(normalizedSearch) ||
      order.description.toLowerCase().includes(normalizedSearch) ||
      (order.roomNumber ?? '').toLowerCase().includes(normalizedSearch);

    const matchesStatus = statusFilter === 'TODOS' || order.status === statusFilter;
    const matchesItem = itemFilter === 'TODOS' || order.item === itemFilter;

    return matchesSearch && matchesStatus && matchesItem;
  });

  const selectedOrder = filteredOrders.find((o) => o.id === selectedId) ?? filteredOrders[0];

  // PROCESO: Cálculo de estadísticas (totales por estado)
  const stats = {
    total: orders.length,
    pendientes: orders.filter((o) => o.status === 'PENDIENTE').length,
    enProceso: orders.filter((o) => o.status === 'EN_PROCESO').length,
    listos: orders.filter((o) => o.status === 'LISTO').length
  };

  function showConfirm(title: string, message: string, onConfirm: () => void) {
    setConfirmTitle(title);
    setConfirmMessage(message);
    setConfirmAction(() => onConfirm);
  }

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

  // PROCESO: Solicitar eliminación (admin → confirmación directa; otros → requiere contraseña admin)
  function requestDelete(id: number) {
    if (isAdmin) {
      confirmDelete(id);
    } else {
      setPendingDeleteId(id);
      setShowAdminAuth(true);
    }
  }

  // PROCESO: Confirmar y eliminar la orden (DELETE /laundry/:id)
  function confirmDelete(id: number) {
    showConfirm(
      '¿Eliminar esta orden de lavandería?',
      'Esta acción no se puede deshacer.',
      () => {
        deleteLaundryRequest(id)
          .then(() => loadOrders())
          .catch((error) => console.error('Error deleting order:', error));
      }
    );
  }

  // PROCESO: Al autorizar la contraseña admin, procede con la eliminación pendiente
  function onAdminAuthorized() {
    setShowAdminAuth(false);
    if (pendingDeleteId !== null) {
      confirmDelete(pendingDeleteId);
      setPendingDeleteId(null);
    }
  }

  function closeAdminAuth() {
    setShowAdminAuth(false);
    setPendingDeleteId(null);
  }

  function openCreateForm() {
    setEditingOrder(null);
    setShowForm(true);
  }

  function openEditForm(order: Laundry) {
    setEditingOrder(order);
    setShowForm(true);
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

  function confirm() {
    if (confirmAction) {
      confirmAction();
      setConfirmAction(null);
    }
  }

  return {
    loading,
    filteredOrders,
    selectedOrder,
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
    onFormSaved,
    closeForm,
    showAdminAuth,
    onAdminAuthorized,
    closeAdminAuth,
    requestDelete,
    handleAdvanceStatus,
    confirmAction,
    confirmTitle,
    confirmMessage,
    confirm,
    closeConfirm: () => setConfirmAction(null)
  };
}