import {
    CheckCircle,
    Clock3,
    PackageCheck,
    Plus,
    Shirt
} from 'lucide-react';
import { type ReactElement, useCallback, useEffect, useState } from 'react';
import {
    type Laundry,
    type PublicUser,
    laundryRequest,
    updateLaundryRequest,
    deleteLaundryRequest
} from '../lib/api';
import { AdminPasswordModal } from '../components/AdminPasswordModal';
import { ConfirmModal } from '../components/ConfirmModal';
import { AccentButton } from '../components/ui/accent-button';
import { FilterSelect } from '../components/ui/filter-select';
import { SearchInput } from '../components/ui/search-input';
import { StatCard } from '../components/ui/stat-card';
import { LaundryFormModal } from '../components/lavanderia/LaundryFormModal';
import { LaundryDetailCard } from '../components/lavanderia/LaundryDetailCard';
import { LaundryOrdersTable } from '../components/lavanderia/LaundryOrdersTable';
import {
    type LaundryItemType,
    type LaundryStatus,
    itemLabels,
    itemOptions,
    statusLabels,
    statusOptions
} from '../components/lavanderia/types';

// ---------- Componente principal ----------

export function LavanderiaPage({ user }: { user: PublicUser }): ReactElement {
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

    if (loading) {
        return (
            <div className="flex min-h-0 flex-1 items-center justify-center bg-sapay-250">
                <div className="text-[11px] text-sapay-750">Cargando lavandería...</div>
            </div>
        );
    }

    return (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-sapay-250 text-sapay-950">
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-4">
                <div className="grid gap-2 py-2 xl:grid-cols-4">
                    {/* PROCESO: Panel de estadísticas (total, pendientes, en proceso, listos) */}
                    <StatCard
                        icon={Shirt}
                        title="Total Órdenes"
                        value={String(stats.total)}
                        detail="Registradas en el sistema"
                        tone="from-[#f0dfc9] to-[#f7efe4]"
                    />
                    <StatCard
                        icon={Clock3}
                        title="Pendientes"
                        value={String(stats.pendientes)}
                        detail="Por iniciar"
                        tone="from-[#f3e2c8] to-[#fff5df]"
                    />
                    <StatCard
                        icon={PackageCheck}
                        title="En Proceso"
                        value={String(stats.enProceso)}
                        detail="Siendo lavadas"
                        tone="from-[#dbe8f5] to-[#eef5fc]"
                    />
                    <StatCard
                        icon={CheckCircle}
                        title="Listos"
                        value={String(stats.listos)}
                        detail="Para entregar"
                        tone="from-[#d9efdd] to-[#eefaf0]"
                    />
                </div>

                <div className="flex min-h-0 flex-1 flex-col gap-3 xl:flex-row">
                    <section className="flex min-h-0 flex-1 flex-col rounded-[20px] border border-sapay-350 bg-white p-3 shadow-[0_16px_40px_rgba(67,42,27,0.08)]">
                        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between w-full">
                            <div className="min-w-[200px]">
                                <h2 className="text-[13px] font-semibold text-sapay-950">Órdenes de Lavandería</h2>
                            </div>

                            <div className="flex items-center gap-1.5 flex-1 justify-end overflow-x-auto">
                                {/* PROCESO: Buscador (cliente, habitación, descripción) */}
                                <SearchInput value={search} onChange={setSearch} placeholder="Buscar cliente, habitación..." />

                                <FilterSelect
                                    label="Estado"
                                    value={statusFilter}
                                    onChange={setStatusFilter}
                                    options={statusOptions}
                                    labels={statusLabels}
                                />
                                {/* PROCESO: Filtro por prenda */}
                                <FilterSelect
                                    label="Prenda"
                                    value={itemFilter}
                                    onChange={setItemFilter}
                                    options={itemOptions}
                                    labels={itemLabels}
                                />

                                <AccentButton
                                    onClick={() => {
                                        setEditingOrder(null);
                                        setShowForm(true);
                                    }}
                                    className="gap-1.5 bg-sapay-900 text-white hover:bg-[#5b3428] h-8 text-[11px] shrink-0"
                                >
                                    {/* PROCESO: Botón para abrir el modal de creación de nueva orden */}
                                    <Plus size={14} aria-hidden="true" />
                                    Nueva Orden
                                </AccentButton>
                            </div>
                        </div>

                        <LaundryOrdersTable
                            orders={filteredOrders}
                            selectedId={selectedOrder?.id ?? null}
                            onSelect={setSelectedId}
                            onDelete={requestDelete}
                        />
                    </section>

                    {selectedOrder ? (
                        <LaundryDetailCard
                            laundry={selectedOrder}
                            onEdit={() => {
                                setEditingOrder(selectedOrder);
                                setShowForm(true);
                            }}
                            onAdvanceStatus={() => handleAdvanceStatus(selectedOrder)}
                            onDelete={() => requestDelete(selectedOrder.id)}
                        />
                    ) : (
                        <section className="flex min-h-0 w-full flex-col items-center justify-center rounded-[26px] border border-sapay-350 bg-white shadow-[0_20px_50px_rgba(67,42,27,0.08)] xl:w-[380px]">
                            <div className="text-center">
                                <p className="text-[13px] font-medium text-sapay-650">Sin órdenes registradas</p>
                                <p className="mt-1 text-[11px] text-sapay-550">Crea una nueva orden para comenzar</p>
                            </div>
                        </section>
                    )}
                </div>
            </div>

            {showForm && (
                // PROCESO: Modal de creación / edición (con 'editingOrder' presente → editar)
                <LaundryFormModal
                    laundry={editingOrder ?? undefined}
                    onSave={() => {
                        setShowForm(false);
                        setEditingOrder(null);
                        loadOrders();
                    }}
                    onClose={() => {
                        setShowForm(false);
                        setEditingOrder(null);
                    }}
                />
            )}

            {showAdminAuth && (
                // PROCESO: Modal de autorización con contraseña de admin (para eliminar sin ser admin)
                <AdminPasswordModal
                    onSuccess={onAdminAuthorized}
                    onClose={() => {
                        setShowAdminAuth(false);
                        setPendingDeleteId(null);
                    }}
                />
            )}

            {confirmAction && (
                // PROCESO: Modal de confirmación de eliminación
                <ConfirmModal
                    title={confirmTitle}
                    message={confirmMessage}
                    confirmLabel="Sí, eliminar"
                    confirmDanger
                    onConfirm={() => {
                        confirmAction();
                        setConfirmAction(null);
                    }}
                    onClose={() => setConfirmAction(null)}
                />
            )}
        </div>
    );
}