import {
    CheckCircle,
    Clock3,
    PackageCheck,
    Plus,
    SlidersHorizontal,
    Shirt
} from 'lucide-react';
import { type ReactElement, useState } from 'react';
import { type PublicUser } from '../lib/api';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { AccentButton } from '../components/ui/AccentButton';
import { FilterSelect } from '../components/ui/FilterSelect';
import { SearchInput } from '../components/ui/SearchInput';
import { LaundryFormModal } from '../components/lavanderia/LaundryFormModal';
import { LaundryRatesModal } from '../components/lavanderia/LaundryRatesModal';
import { LaundryDetailCard } from '../components/lavanderia/LaundryDetailCard';
import { LaundryOrdersTable } from '../components/lavanderia/LaundryOrdersTable';
import { useLavanderia } from '../components/lavanderia/useLavanderia';
import {
    itemLabels,
    itemOptions,
    loadLaundryPrices,
    saveLaundryPrices,
    statusLabels,
    statusOptions
} from '../components/lavanderia/types';
import { type LaundryItemType } from '../components/lavanderia/types';
import { ModuleHeader } from '../components/ui/ModuleHeader';

// ---------- Componente principal ----------

export function LavanderiaPage({ user }: { user: PublicUser }): ReactElement {
    const l = useLavanderia();
    const [prices, setPrices] = useState(loadLaundryPrices);
    const [showRates, setShowRates] = useState(false);

    async function handleSavePrices(nextPrices: Record<LaundryItemType, number>): Promise<boolean> {
        try {
            await l.repriceOrders(nextPrices);
            saveLaundryPrices(nextPrices);
            setPrices(nextPrices);
            return true;
        } catch {
            return false;
        }
    }

    return (
        <div className="module-page flex min-h-0 flex-1 flex-col overflow-hidden bg-sapay-250 text-sapay-950">
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                <ModuleHeader icon={Shirt} title="Lavandería" subtitle="Gestiona las órdenes, prendas y tarifas del servicio." metrics={[
                    { label: 'Órdenes', value: l.stats.total, icon: Shirt },
                    { label: 'Pendientes', value: l.stats.pendientes, icon: Clock3 },
                    { label: 'En proceso', value: l.stats.enProceso, icon: PackageCheck },
                    { label: 'Listos', value: l.stats.listos, icon: PackageCheck }
                ]} />
                <div className="flex min-h-0 flex-1 flex-col gap-3 lg:flex-row">
                    <section className="flex min-h-0 flex-1 flex-col rounded-[20px] border border-sapay-350 bg-white p-3 shadow-[0_16px_40px_rgba(67,42,27,0.08)]">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between w-full">
                            <div className="min-w-[160px]">
                                <h2 className="text-[13px] font-semibold text-sapay-950">Órdenes de Lavandería</h2>
                            </div>

                            <div className="flex items-center gap-1.5 flex-1 justify-end overflow-x-auto">
                                {/* PROCESO: Buscador (cliente, habitación, descripción) */}
                                <SearchInput value={l.search} onChange={l.setSearch} placeholder="Buscar cliente, habitación..." />

                                <FilterSelect
                                    label="Estado"
                                    value={l.statusFilter}
                                    onChange={l.setStatusFilter}
                                    options={statusOptions}
                                    labels={statusLabels}
                                />
                                {/* PROCESO: Filtro por prenda */}
                                <FilterSelect
                                    label="Prenda"
                                    value={l.itemFilter}
                                    onChange={l.setItemFilter}
                                    options={itemOptions}
                                    labels={itemLabels}
                                />

                                <AccentButton
                                    onClick={() => setShowRates(true)}
                                    className="gap-1.5 h-8 shrink-0 text-[11px]"
                                >
                                    <SlidersHorizontal size={14} aria-hidden="true" />
                                    Tarifas
                                </AccentButton>

                                <AccentButton
                                    onClick={l.openCreateForm}
                                    className="gap-1.5 bg-sapay-900 text-white hover:bg-[#5b3428] h-8 text-[11px] shrink-0"
                                >
                                    {/* PROCESO: Botón para abrir el modal de creación de nueva orden */}
                                    <Plus size={14} aria-hidden="true" />
                                    Nueva Orden
                                </AccentButton>
                            </div>
                        </div>

                        <LaundryOrdersTable
                            orders={l.filteredOrders}
                            selectedId={l.selectedOrder?.id ?? null}
                            onSelect={l.setSelectedId}
                            onDelete={l.requestDelete}
                        />
                    </section>

                    {l.selectedOrder ? (
                        <LaundryDetailCard
                            laundry={l.selectedOrder}
                            onEdit={() => l.openEditForm(l.selectedOrder!)}
                            onAdvanceStatus={() => l.handleAdvanceStatus(l.selectedOrder!)}
                            onDelete={() => l.requestDelete(l.selectedOrder!.id)}
                        />
                    ) : (
                        <section className="flex min-h-0 w-full flex-col items-center justify-center rounded-[26px] border border-sapay-350 bg-white shadow-[0_20px_50px_rgba(67,42,27,0.08)] lg:w-[320px] xl:w-[380px]">
                            <div className="text-center">
                                <p className="text-[13px] font-medium text-sapay-650">Sin órdenes registradas</p>
                                <p className="mt-1 text-[11px] text-sapay-550">Crea una nueva orden para comenzar</p>
                            </div>
                        </section>
                    )}
                </div>
            </div>

            {l.showForm && (
                // PROCESO: Modal de creación / edición (con 'editingOrder' presente → editar)
                <LaundryFormModal
                    laundry={l.editingOrder ?? undefined}
                    prices={prices}
                    onSubmit={l.submitOrder}
                    onClose={l.closeForm}
                />
            )}

            {showRates && (
                <LaundryRatesModal
                    prices={prices}
                    onSave={handleSavePrices}
                    onClose={() => setShowRates(false)}
                />
            )}

            {l.confirmAction && (
                // PROCESO: Modal de confirmación de eliminación
                <ConfirmModal
                    title={l.confirmTitle}
                    message={l.confirmMessage}
                    confirmLabel="Sí, eliminar"
                    confirmDanger
                    onConfirm={l.confirm}
                    onClose={l.closeConfirm}
                />
            )}
        </div>
    );
}