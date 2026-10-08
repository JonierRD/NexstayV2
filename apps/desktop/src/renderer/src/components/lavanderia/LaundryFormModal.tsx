import { BookOpen, Minus, Plus, X } from 'lucide-react';
import { type ReactElement, useEffect, useState } from 'react';
import { type Laundry, type LaundryPayload, type Stay, staysActiveRequest } from '../../lib/api';
import { AccentButton } from '../ui/AccentButton';
import { DetailLine } from '../ui/DetailLine';
import {
    type LaundryFormState,
    type LaundryItemType,
    type LaundryStatus,
    emptyForm,
    itemLabels,
    itemOptions,
    itemPluralLabels,
    parseLaundryItemCounts,
    statusLabels,
    statusOptions,
    fmtMoney
} from './types';

type Props = {
    laundry?: Laundry;
    prices: Record<LaundryItemType, number>;
    /** Ejecuta create/update. Lanza si la API falla. */
    onSubmit: (payload: LaundryPayload) => Promise<void>;
    onClose: () => void;
};

function getSuggestedDeliveryDate(): string {
    const date = new Date();
    date.setDate(date.getDate() + 2);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function LaundryFormModal({ laundry, prices, onSubmit, onClose }: Props): ReactElement {
    const [form, setForm] = useState<LaundryFormState>(
        laundry
            ? {
                clientName: laundry.clientName,
                roomNumber: laundry.roomNumber ?? '',
                notes: laundry.notes ?? '',
                status: laundry.status as LaundryStatus,
                deliveryDate: laundry.deliveryDate ? laundry.deliveryDate.slice(0, 10) : ''
            }
            : { ...emptyForm, deliveryDate: getSuggestedDeliveryDate() }
    );
    const [itemCounts, setItemCounts] = useState<Record<LaundryItemType, number>>(() => {
        return laundry
            ? parseLaundryItemCounts(laundry.description, laundry.item as LaundryItemType, laundry.quantity)
            : Object.fromEntries(itemOptions.map((item) => [item, 0])) as Record<LaundryItemType, number>;
    });
    const [stays, setStays] = useState<Stay[]>([]);
    const [selectedStayId, setSelectedStayId] = useState<number | ''>('');
    const [loadingStays, setLoadingStays] = useState(true);
    const [showPriceList, setShowPriceList] = useState(false);
    const [itemsChanged, setItemsChanged] = useState(false);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        staysActiveRequest()
            .then((activeStays) => {
                setStays(activeStays);
                const existingStay = activeStays.find((stay) =>
                    stay.roomNumber === laundry?.roomNumber &&
                    `${stay.client?.firstName ?? ''} ${stay.client?.lastName ?? ''}`.trim() === laundry?.clientName
                );
                if (existingStay) setSelectedStayId(existingStay.id);
            })
            .catch(() => setError('No se pudieron cargar los huéspedes activos.'))
            .finally(() => setLoadingStays(false));
    }, [laundry]);

    const quantityNum = Object.values(itemCounts).reduce((sum, count) => sum + count, 0);
    const total = laundry && !itemsChanged
        ? laundry.totalPrice
        : itemOptions.reduce((sum, item) => sum + itemCounts[item] * prices[item], 0);
    const description = itemOptions
        .filter((item) => itemCounts[item] > 0)
        .map((item) => `${itemCounts[item]} ${itemPluralLabels[item]}`)
        .join(', ');

    function update<K extends keyof LaundryFormState>(key: K, value: LaundryFormState[K]) {
        setForm((prev) => ({ ...prev, [key]: value }));
    }

    function changeStay(value: string) {
        const stay = stays.find((item) => String(item.id) === value);
        setSelectedStayId(stay?.id ?? '');
        if (!stay) return;
        update('clientName', `${stay.client?.firstName ?? ''} ${stay.client?.lastName ?? ''}`.trim());
        update('roomNumber', stay.roomNumber);
    }

    function changeCount(item: LaundryItemType, change: number) {
        setItemsChanged(true);
        setItemCounts((counts) => ({ ...counts, [item]: Math.max(0, counts[item] + change) }));
    }

    // PROCESO: Validación de huésped activo y prendas seleccionadas.
    async function handleSubmit() {
        setError('');

        if (!form.clientName.trim()) {
            setError('Debes indicar el nombre del cliente o huésped.');
            return;
        }
        if (!selectedStayId && !laundry) {
            setError('Selecciona un huésped activo y su habitación.');
            return;
        }
        if (quantityNum <= 0) {
            setError('Agrega al menos una prenda a la orden.');
            return;
        }

        setSaving(true);
        try {
            // PROCESO: Envío a la API. Si hay 'laundry' → actualizar (PUT) / si no → crear (POST)
            const payload: LaundryPayload = {
                item: itemOptions.find((item) => itemCounts[item] > 0)!,
                description,
                quantity: quantityNum,
                unitPrice: laundry && !itemsChanged ? laundry.unitPrice : Math.round(total / quantityNum),
                totalPrice: total,
                clientName: form.clientName.trim(),
                roomNumber: form.roomNumber.trim() || undefined,
                notes: form.notes.trim() || undefined,
                deliveryDate: form.deliveryDate || undefined
            };

            if (laundry) {
                // PROCESO: Editar / actualizar orden existente (PUT /laundry/:id)
                await onSubmit({ ...payload, status: form.status });
            } else {
                // PROCESO: Crear nueva orden (POST /laundry)
                await onSubmit(payload);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al guardar la orden de lavandería.');
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="flex max-h-[calc(100vh-32px)] w-full max-w-lg flex-col rounded-[22px] border border-sapay-350 bg-white p-5 shadow-[0_24px_60px_rgba(67,42,27,0.18)]">
                <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-[15px] font-semibold text-sapay-950">
                        {laundry ? 'Editar Orden de Lavandería' : 'Nueva Orden de Lavandería'}
                    </h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-sapay-650 hover:bg-sapay-250"
                        aria-label="Cerrar"
                    >
                        <X size={16} aria-hidden="true" />
                    </button>
                </div>

                {error && (
                    <div className="mb-3 rounded-xl border border-danger-200 bg-danger-100 px-3 py-2 text-[11px] text-[#b33a3a]">
                        {error}
                    </div>
                )}

                <div className="min-h-0 flex-1 overflow-y-auto pr-1">
                <div className="mb-3 flex items-center justify-between">
                    <h4 className="text-[11px] font-semibold uppercase text-sapay-650">Prendas</h4>
                    <button type="button" onClick={() => setShowPriceList((value) => !value)} className="flex items-center gap-1 text-[11px] font-medium text-sapay-750 hover:text-sapay-950">
                        <BookOpen size={14} aria-hidden="true" />
                        {showPriceList ? 'Ocultar tarifas' : 'Ver tarifas'}
                    </button>
                </div>

                {showPriceList && (
                    <div className="mb-3 grid grid-cols-2 gap-x-4 gap-y-1 rounded-xl border border-sapay-300 bg-sapay-100 p-3 text-[11px]">
                        {itemOptions.map((item) => <DetailLine key={item} label={itemLabels[item]} value={fmtMoney(prices[item])} />)}
                    </div>
                )}

                <div className="mb-4 space-y-1.5">
                    {itemOptions.map((item) => (
                        <div key={item} className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-2 rounded-lg border border-sapay-250 px-3 py-1.5">
                            <div>
                                <p className="text-[12px] font-medium text-sapay-950">{itemLabels[item]}</p>
                                <p className="text-[10px] text-sapay-600">{fmtMoney(prices[item])} por prenda</p>
                            </div>
                            <button type="button" aria-label={`Quitar una ${itemLabels[item].toLowerCase()}`} onClick={() => changeCount(item, -1)} className="flex h-7 w-7 items-center justify-center rounded-md border border-sapay-350 text-sapay-800 hover:bg-sapay-100">
                                <Minus size={13} aria-hidden="true" />
                            </button>
                            <span className="w-6 text-center text-[12px] font-semibold tabular-nums">{itemCounts[item]}</span>
                            <button type="button" aria-label={`Agregar una ${itemLabels[item].toLowerCase()}`} onClick={() => changeCount(item, 1)} className="flex h-7 w-7 items-center justify-center rounded-md bg-sapay-900 text-white hover:bg-[#5b3428]">
                                <Plus size={13} aria-hidden="true" />
                            </button>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-2 gap-3">
                    {laundry && (
                        <div className="col-span-2 sm:col-span-1">
                            <label className="mb-1 block text-[11px] font-medium text-sapay-750">Estado</label>
                            <select
                                value={form.status}
                                onChange={(e) => update('status', e.target.value as LaundryStatus)}
                                className="h-9 w-full rounded-xl border border-sapay-400 bg-sapay-100 px-3 text-[12px] text-sapay-950 outline-none focus:border-sapay-600"
                            >
                                {statusOptions.map((opt) => (
                                    <option key={opt} value={opt}>{statusLabels[opt]}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="col-span-2">
                        <label className="mb-1 block text-[11px] font-medium text-sapay-750">Huésped activo</label>
                        <select value={selectedStayId} onChange={(event) => changeStay(event.target.value)} disabled={loadingStays} className="h-9 w-full rounded-xl border border-sapay-400 bg-sapay-100 px-3 text-[12px] text-sapay-950 outline-none focus:border-sapay-600">
                            <option value="">{loadingStays ? 'Cargando huéspedes...' : 'Seleccionar huésped'}</option>
                            {stays.map((stay) => <option key={stay.id} value={stay.id}>{stay.client?.firstName} {stay.client?.lastName} · Habitación {stay.roomNumber}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="mb-1 block text-[11px] font-medium text-sapay-750">Habitación ocupada</label>
                        <select value={selectedStayId} onChange={(event) => changeStay(event.target.value)} disabled={loadingStays} className="h-9 w-full rounded-xl border border-sapay-400 bg-sapay-100 px-3 text-[12px] text-sapay-950 outline-none focus:border-sapay-600">
                            <option value="">Seleccionar habitación</option>
                            {stays.map((stay) => <option key={stay.id} value={stay.id}>Habitación {stay.roomNumber} · {stay.client?.firstName} {stay.client?.lastName}</option>)}
                        </select>
                    </div>

                    <div className="flex items-end text-[11px] text-sapay-650">Los dos campos se actualizan juntos.</div>

                    <div className="col-span-2 rounded-xl border border-[#c3b5a8] bg-[#f9f0e6] px-3 py-2 text-[12px]">
                        <DetailLine label={description || 'Prendas seleccionadas'} value={fmtMoney(total)} />
                    </div>

                    <div>
                        <label className="mb-1 block text-[11px] font-medium text-sapay-750">Fecha de entrega</label>
                        <input
                            type="date"
                            value={form.deliveryDate}
                            onChange={(e) => update('deliveryDate', e.target.value)}
                            className="h-9 w-full rounded-xl border border-sapay-400 bg-sapay-100 px-3 text-[12px] text-sapay-950 outline-none focus:border-sapay-600"
                        />
                    </div>

                    <div className="col-span-2">
                        <label className="mb-1 block text-[11px] font-medium text-sapay-750">Notas (opcional)</label>
                        <input
                            type="text"
                            value={form.notes}
                            onChange={(e) => update('notes', e.target.value)}
                            placeholder="Observaciones adicionales"
                            className="h-9 w-full rounded-xl border border-sapay-400 bg-sapay-100 px-3 text-[12px] text-sapay-950 outline-none placeholder:text-sapay-550 focus:border-sapay-600"
                        />
                    </div>
                </div>
                </div>

                <div className="mt-5 flex justify-end gap-2">
                    <AccentButton onClick={onClose}>Cancelar</AccentButton>
                    <AccentButton
                        onClick={handleSubmit}
                        className="bg-sapay-900 text-white hover:bg-[#5b3428]"
                    >
                        {saving ? 'Guardando...' : laundry ? 'Guardar Cambios' : 'Crear Orden'}
                    </AccentButton>
                </div>
            </div>
        </div>
    );
}