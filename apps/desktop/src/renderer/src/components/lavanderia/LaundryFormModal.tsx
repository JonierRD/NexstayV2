import { X } from 'lucide-react';
import { type ReactElement, useState } from 'react';
import {
    type Laundry,
    createLaundryRequest,
    updateLaundryRequest
} from '../../lib/api';
import { AccentButton } from '../ui/accent-button';
import { DetailLine } from '../ui/detail-line';
import {
    type LaundryItemType,
    type LaundryStatus,
    type LaundryFormState,
    emptyForm,
    itemLabels,
    itemOptions,
    statusLabels,
    statusOptions,
    fmtMoney
} from './types';

type Props = {
    laundry?: Laundry;
    onSave: () => void;
    onClose: () => void;
};

export function LaundryFormModal({ laundry, onSave, onClose }: Props): ReactElement {
    const [form, setForm] = useState<LaundryFormState>(
        laundry
            ? {
                item: laundry.item as LaundryItemType,
                description: laundry.description,
                quantity: String(laundry.quantity),
                unitPrice: String(laundry.unitPrice),
                clientName: laundry.clientName,
                roomNumber: laundry.roomNumber ?? '',
                notes: laundry.notes ?? '',
                status: laundry.status as LaundryStatus,
                deliveryDate: laundry.deliveryDate ? laundry.deliveryDate.slice(0, 10) : ''
            }
            : emptyForm
    );
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    const quantityNum = Number(form.quantity) || 0;
    const unitPriceNum = Number(form.unitPrice) || 0;
    // PROCESO: Cálculo automático del total (cantidad × precio unitario)
    const total = quantityNum * unitPriceNum;

    function update<K extends keyof LaundryFormState>(key: K, value: LaundryFormState[K]) {
        setForm((prev) => ({ ...prev, [key]: value }));
    }

    // PROCESO: Validación de campos (cliente, descripción, cantidad > 0, precio > 0)
    async function handleSubmit() {
        setError('');

        if (!form.clientName.trim()) {
            setError('Debes indicar el nombre del cliente o huésped.');
            return;
        }
        if (!form.description.trim()) {
            setError('Debes agregar una descripción de la orden.');
            return;
        }
        if (quantityNum <= 0) {
            setError('La cantidad debe ser mayor a 0.');
            return;
        }
        if (unitPriceNum <= 0) {
            setError('El precio unitario debe ser mayor a 0.');
            return;
        }

        setSaving(true);
        try {
            // PROCESO: Envío a la API. Si hay 'laundry' → actualizar (PUT) / si no → crear (POST)
            const payload = {
                item: form.item,
                description: form.description.trim(),
                quantity: quantityNum,
                unitPrice: unitPriceNum,
                totalPrice: total,
                clientName: form.clientName.trim(),
                roomNumber: form.roomNumber.trim() || undefined,
                notes: form.notes.trim() || undefined,
                deliveryDate: form.deliveryDate || undefined
            };

            if (laundry) {
                // PROCESO: Editar / actualizar orden existente (PUT /laundry/:id)
                await updateLaundryRequest(laundry.id, { ...payload, status: form.status });
            } else {
                // PROCESO: Crear nueva orden (POST /laundry)
                await createLaundryRequest(payload);
            }
            onSave();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al guardar la orden de lavandería.');
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-lg rounded-[22px] border border-[#eadfd6] bg-white p-5 shadow-[0_24px_60px_rgba(67,42,27,0.18)]">
                <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-[15px] font-semibold text-[#2b1b14]">
                        {laundry ? 'Editar Orden de Lavandería' : 'Nueva Orden de Lavandería'}
                    </h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-[#8d7b70] hover:bg-[#f6f1eb]"
                        aria-label="Cerrar"
                    >
                        <X size={16} aria-hidden="true" />
                    </button>
                </div>

                {error && (
                    <div className="mb-3 rounded-xl border border-[#f1c2c2] bg-[#fff0f0] px-3 py-2 text-[11px] text-[#b33a3a]">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2 sm:col-span-1">
                        <label className="mb-1 block text-[11px] font-medium text-[#7d6d61]">Prenda</label>
                        <select
                            value={form.item}
                            onChange={(e) => update('item', e.target.value as LaundryItemType)}
                            className="h-9 w-full rounded-xl border border-[#e0d4ca] bg-[#fcfaf8] px-3 text-[12px] text-[#2b1b14] outline-none focus:border-[#b08f7c]"
                        >
                            {itemOptions.map((opt) => (
                                <option key={opt} value={opt}>{itemLabels[opt]}</option>
                            ))}
                        </select>
                    </div>

                    {laundry && (
                        <div className="col-span-2 sm:col-span-1">
                            <label className="mb-1 block text-[11px] font-medium text-[#7d6d61]">Estado</label>
                            <select
                                value={form.status}
                                onChange={(e) => update('status', e.target.value as LaundryStatus)}
                                className="h-9 w-full rounded-xl border border-[#e0d4ca] bg-[#fcfaf8] px-3 text-[12px] text-[#2b1b14] outline-none focus:border-[#b08f7c]"
                            >
                                {statusOptions.map((opt) => (
                                    <option key={opt} value={opt}>{statusLabels[opt]}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="col-span-2">
                        <label className="mb-1 block text-[11px] font-medium text-[#7d6d61]">Descripción</label>
                        <input
                            type="text"
                            value={form.description}
                            onChange={(e) => update('description', e.target.value)}
                            placeholder="Ej: 3 camisas blancas, 2 pantalones de dril"
                            className="h-9 w-full rounded-xl border border-[#e0d4ca] bg-[#fcfaf8] px-3 text-[12px] text-[#2b1b14] outline-none placeholder:text-[#a49486] focus:border-[#b08f7c]"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-[11px] font-medium text-[#7d6d61]">Cantidad</label>
                        <input
                            type="number"
                            min={1}
                            value={form.quantity}
                            onChange={(e) => update('quantity', e.target.value)}
                            className="h-9 w-full rounded-xl border border-[#e0d4ca] bg-[#fcfaf8] px-3 text-[12px] text-[#2b1b14] outline-none focus:border-[#b08f7c]"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-[11px] font-medium text-[#7d6d61]">Precio unitario</label>
                        <input
                            type="number"
                            min={0}
                            value={form.unitPrice}
                            onChange={(e) => update('unitPrice', e.target.value)}
                            placeholder="$"
                            className="h-9 w-full rounded-xl border border-[#e0d4ca] bg-[#fcfaf8] px-3 text-[12px] text-[#2b1b14] outline-none placeholder:text-[#a49486] focus:border-[#b08f7c]"
                        />
                    </div>

                    <div className="col-span-2 rounded-xl border border-[#c3b5a8] bg-[#f9f0e6] px-3 py-2 text-[12px]">
                        <DetailLine label="Total a cobrar" value={fmtMoney(total)} />
                    </div>

                    <div>
                        <label className="mb-1 block text-[11px] font-medium text-[#7d6d61]">Cliente / Huésped</label>
                        <input
                            type="text"
                            value={form.clientName}
                            onChange={(e) => update('clientName', e.target.value)}
                            placeholder="Nombre completo"
                            className="h-9 w-full rounded-xl border border-[#e0d4ca] bg-[#fcfaf8] px-3 text-[12px] text-[#2b1b14] outline-none placeholder:text-[#a49486] focus:border-[#b08f7c]"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-[11px] font-medium text-[#7d6d61]">Habitación (opcional)</label>
                        <input
                            type="text"
                            value={form.roomNumber}
                            onChange={(e) => update('roomNumber', e.target.value)}
                            placeholder="Ej: 12"
                            className="h-9 w-full rounded-xl border border-[#e0d4ca] bg-[#fcfaf8] px-3 text-[12px] text-[#2b1b14] outline-none placeholder:text-[#a49486] focus:border-[#b08f7c]"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-[11px] font-medium text-[#7d6d61]">Fecha de entrega</label>
                        <input
                            type="date"
                            value={form.deliveryDate}
                            onChange={(e) => update('deliveryDate', e.target.value)}
                            className="h-9 w-full rounded-xl border border-[#e0d4ca] bg-[#fcfaf8] px-3 text-[12px] text-[#2b1b14] outline-none focus:border-[#b08f7c]"
                        />
                    </div>

                    <div className="col-span-2">
                        <label className="mb-1 block text-[11px] font-medium text-[#7d6d61]">Notas (opcional)</label>
                        <input
                            type="text"
                            value={form.notes}
                            onChange={(e) => update('notes', e.target.value)}
                            placeholder="Observaciones adicionales"
                            className="h-9 w-full rounded-xl border border-[#e0d4ca] bg-[#fcfaf8] px-3 text-[12px] text-[#2b1b14] outline-none placeholder:text-[#a49486] focus:border-[#b08f7c]"
                        />
                    </div>
                </div>

                <div className="mt-5 flex justify-end gap-2">
                    <AccentButton onClick={onClose}>Cancelar</AccentButton>
                    <AccentButton
                        onClick={handleSubmit}
                        className="bg-[#4b2b21] text-white hover:bg-[#5b3428]"
                    >
                        {saving ? 'Guardando...' : laundry ? 'Guardar Cambios' : 'Crear Orden'}
                    </AccentButton>
                </div>
            </div>
        </div>
    );
}