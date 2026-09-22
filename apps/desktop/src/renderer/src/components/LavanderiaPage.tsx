import {
    Shirt,
    Clock3,
    CheckCircle,
    PackageCheck,
    ChevronRight,
    Eye,
    PencilLine,
    Plus,
    Search,
    Trash2,
    X
} from 'lucide-react';
import { type ReactElement, useCallback, useEffect, useState } from 'react';
import {
    type Laundry,
    type PublicUser,
    laundryRequest,
    createLaundryRequest,
    updateLaundryRequest,
    deleteLaundryRequest
} from '../lib/api';
import { cn } from '../lib/utils';
import { AdminPasswordModal } from './AdminPasswordModal';
import { ConfirmModal } from './ConfirmModal';

type LaundryStatus = 'PENDIENTE' | 'EN_PROCESO' | 'LISTO' | 'ENTREGADO';
type LaundryItemType = 'CAMISA' | 'PANTALON' | 'TOALLA' | 'SABANA' | 'FUNDAS_ALMOHADA' | 'EDREDON' | 'OTRO';

const statusStyles: Record<LaundryStatus, string> = {
    PENDIENTE: 'bg-[#fff5df] text-[#c78b14] border-[#f2dbab]',
    EN_PROCESO: 'bg-[#eaf1fb] text-[#2f6f9f] border-[#c6dcf0]',
    LISTO: 'bg-[#e9f6eb] text-[#2f8f4e] border-[#c6e8cf]',
    ENTREGADO: 'bg-[#f5efe9] text-[#8f5e3d] border-[#dcc5b1]'
};

const statusLabels: Record<LaundryStatus, string> = {
    PENDIENTE: 'Pendiente',
    EN_PROCESO: 'En Proceso',
    LISTO: 'Listo',
    ENTREGADO: 'Entregado'
};

const itemLabels: Record<LaundryItemType, string> = {
    CAMISA: 'Camisa',
    PANTALON: 'Pantalón',
    TOALLA: 'Toalla',
    SABANA: 'Sábana',
    FUNDAS_ALMOHADA: 'Fundas de Almohada',
    EDREDON: 'Edredón',
    OTRO: 'Otro'
};

const itemOptions: LaundryItemType[] = ['CAMISA', 'PANTALON', 'TOALLA', 'SABANA', 'FUNDAS_ALMOHADA', 'EDREDON', 'OTRO'];
const statusOptions: LaundryStatus[] = ['PENDIENTE', 'EN_PROCESO', 'LISTO', 'ENTREGADO'];

const laundryPriceCatalog: Record<LaundryItemType, number> = {
    CAMISA: 1000,
    PANTALON: 3000,
    TOALLA: 800,
    SABANA: 1500,
    FUNDAS_ALMOHADA: 600,
    EDREDON: 5000,
    OTRO: 2000
};

const guestRoomMap: Record<string, string> = {
    'Juan Pérez': '101',
    'María López': '102',
    'Carlos Ruiz': '205',
    'Ana García': '310'
};

const guestOptions = Object.keys(guestRoomMap);
const roomOptions = Object.values(guestRoomMap);

function fmtMoney(n: number): string {
    return `$${Math.round(n).toLocaleString('es-CO')}`;
}

function pluralizeItem(item: LaundryItemType, quantity: number): string {
    const base = itemLabels[item].toLowerCase();
    if (quantity === 1) return base;

    if (item === 'PANTALON') return 'pantalones';
    if (item === 'CAMISA') return 'camisas';
    if (item === 'TOALLA') return 'toallas';
    if (item === 'SABANA') return 'sábanas';
    if (item === 'FUNDAS_ALMOHADA') return 'fundas de almohada';
    if (item === 'EDREDON') return 'edredones';
    return 'prendas';
}

function buildLaundryDescription(selectedItems: Record<LaundryItemType, number>): string {
    const parts = itemOptions
        .filter((item) => selectedItems[item] > 0)
        .map((item) => `${selectedItems[item]} ${pluralizeItem(item, selectedItems[item])}`);

    return parts.join(', ');
}

function fmtDate(iso: string | null): string {
    if (!iso) return '---';
    const d = new Date(iso);
    return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}

function StatCard({
    icon: Icon,
    title,
    value,
    detail,
    tone
}: {
    icon: React.ElementType;
    title: string;
    value: string;
    detail: string;
    tone: string;
}): ReactElement {
    return (
        <article className="rounded-[16px] border border-[#eadfd6] bg-white p-3 shadow-[0_12px_30px_rgba(67,42,27,0.06)]">
            <div className="flex items-center gap-3">
                <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br', tone)}>
                    <Icon size={18} className="text-[#4b2b21]" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                    <p className="text-[10px] font-medium text-[#7d6e63]">{title}</p>
                    <p className="text-[18px] leading-none font-semibold tracking-tight text-[#2b1b14]">{value}</p>
                    <p className="text-[10px] text-[#8b7b70]">{detail}</p>
                </div>
            </div>
        </article>
    );
}

function StatusPill({ status }: { status: LaundryStatus }): ReactElement {
    return (
        <span className={cn('inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold tracking-wide', statusStyles[status])}>
            {statusLabels[status]}
        </span>
    );
}

function AccentButton({
    children,
    active,
    onClick,
    className
}: {
    children: React.ReactNode;
    active?: boolean;
    onClick?: () => void;
    className?: string;
}): ReactElement {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                'inline-flex h-9 items-center justify-center rounded-xl border px-3 text-[12px] font-medium transition',
                active
                    ? 'border-[#4b2b21] bg-[#4b2b21] text-white shadow-[0_10px_26px_rgba(75,43,33,0.28)]'
                    : 'border-[#dccfca] bg-white text-[#4b2b21] hover:border-[#bfa89d] hover:bg-[#faf6f2]',
                className
            )}
        >
            {children}
        </button>
    );
}

function DetailLine({ label, value }: { label: string; value: string }): ReactElement {
    return (
        <div className="flex items-start justify-between gap-3">
            <dt className="min-w-0 text-[#7d6d61]">{label}:</dt>
            <dd className="min-w-0 text-right font-medium text-[#2b1b14]">{value}</dd>
        </div>
    );
}

function IconButton({
    icon: Icon,
    label,
    onClick,
    danger
}: {
    icon: React.ElementType;
    label: string;
    onClick?: () => void;
    danger?: boolean;
}): ReactElement {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                'inline-flex h-[38px] w-[38px] items-center justify-center rounded-full border bg-white shadow-sm transition',
                danger
                    ? 'border-[#f0c8c4] text-[#c94a43] hover:border-[#e5a0a0] hover:bg-[#fff5f5]'
                    : 'border-[#ddd2c8] text-[#5a463a] hover:border-[#bfa89d] hover:bg-[#faf6f2]'
            )}
            title={label}
            aria-label={label}
        >
            <Icon size={18} aria-hidden="true" />
        </button>
    );
}

function FilterSelect<T extends string>({
    label,
    value,
    onChange,
    options,
    labels
}: {
    label: string;
    value: T | 'TODOS';
    onChange: (value: T | 'TODOS') => void;
    options: T[];
    labels?: Record<T, string>;
}): ReactElement {
    return (
        <label className="flex h-8 min-w-[130px] shrink-0 cursor-pointer items-center gap-1 rounded-xl border border-[#e0d4ca] bg-[#fcfaf8] px-2.5 text-[#8d7b70] transition focus-within:border-[#b08f7c] focus-within:bg-white">
            <select
                value={value}
                onChange={(event) => onChange(event.target.value as T | 'TODOS')}
                className="min-w-0 flex-1 appearance-none bg-transparent text-[11px] text-[#2b1b14] outline-none"
            >
                <option value="TODOS">{label}</option>
                {options.map((option) => (
                    <option key={option} value={option}>
                        {labels ? labels[option] : option}
                    </option>
                ))}
            </select>
            <ChevronRight size={12} className="shrink-0 rotate-90 text-[#8d7b70] pointer-events-none" aria-hidden="true" />
        </label>
    );
}

// ---------- Modal de creación / edición ----------

type LaundryFormState = {
    item: LaundryItemType;
    description: string;
    quantity: string;
    unitPrice: string;
    clientName: string;
    roomNumber: string;
    notes: string;
    status: LaundryStatus;
    deliveryDate: string;
};

const emptyForm: LaundryFormState = {
    item: 'CAMISA',
    description: '',
    quantity: '1',
    unitPrice: '',
    clientName: '',
    roomNumber: '',
    notes: '',
    status: 'PENDIENTE',
    deliveryDate: ''
};

function LaundryFormModal({
    laundry,
    onSave,
    onClose
}: {
    laundry?: Laundry;
    onSave: () => void;
    onClose: () => void;
}): ReactElement {
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
    const [selectedItems, setSelectedItems] = useState<Record<LaundryItemType, number>>({
        CAMISA: 0,
        PANTALON: 0,
        TOALLA: 0,
        SABANA: 0,
        FUNDAS_ALMOHADA: 0,
        EDREDON: 0,
        OTRO: 0
    });
    const [selectedGuest, setSelectedGuest] = useState(laundry?.clientName ?? '');
    const [selectedRoom, setSelectedRoom] = useState(laundry?.roomNumber ?? '');
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    const quantityNum = Object.values(selectedItems).reduce((sum, qty) => sum + qty, 0);
    const total = itemOptions.reduce((sum, item) => sum + (selectedItems[item] ?? 0) * laundryPriceCatalog[item], 0);
    const descriptionPreview = buildLaundryDescription(selectedItems);

    function update<K extends keyof LaundryFormState>(key: K, value: LaundryFormState[K]) {
        setForm((prev) => ({ ...prev, [key]: value }));
    }

    function handleItemChange(item: LaundryItemType, delta: number) {
        setSelectedItems((prev) => ({
            ...prev,
            [item]: Math.max(0, (prev[item] ?? 0) + delta)
        }));
    }

    function handleGuestSelect(nextGuest: string) {
        setSelectedGuest(nextGuest);
        setForm((prev) => ({ ...prev, clientName: nextGuest }));

        const matchingRoom = guestRoomMap[nextGuest];
        if (matchingRoom) {
            setSelectedRoom(matchingRoom);
            setForm((prev) => ({ ...prev, roomNumber: matchingRoom }));
        }
    }

    function handleRoomSelect(nextRoom: string) {
        setSelectedRoom(nextRoom);
        setForm((prev) => ({ ...prev, roomNumber: nextRoom }));

        const matchingGuest = Object.entries(guestRoomMap).find(([, room]) => room === nextRoom)?.[0];
        if (matchingGuest) {
            setSelectedGuest(matchingGuest);
            setForm((prev) => ({ ...prev, clientName: matchingGuest }));
        }
    }

    async function handleSubmit() {
        setError('');

        if (!form.clientName.trim()) {
            setError('Debes indicar el nombre del cliente o huésped.');
            return;
        }
        if (!descriptionPreview.trim()) {
            setError('Debes elegir al menos una prenda para la orden.');
            return;
        }
        if (quantityNum <= 0) {
            setError('La cantidad total debe ser mayor a 0.');
            return;
        }
        if (total <= 0) {
            setError('El total debe ser mayor a 0.');
            return;
        }

        setSaving(true);
        try {
            const primaryItem = itemOptions.find((item) => (selectedItems[item] ?? 0) > 0) ?? form.item;
            const payload = {
                item: primaryItem,
                description: descriptionPreview.trim(),
                quantity: quantityNum,
                unitPrice: total,
                totalPrice: total,
                clientName: form.clientName.trim(),
                roomNumber: form.roomNumber.trim() || undefined,
                notes: form.notes.trim() || undefined,
                deliveryDate: form.deliveryDate || undefined
            };

            if (laundry) {
                await updateLaundryRequest(laundry.id, { ...payload, status: form.status });
            } else {
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
            <div className="w-full max-w-2xl rounded-[22px] border border-[#eadfd6] bg-white p-5 shadow-[0_24px_60px_rgba(67,42,27,0.18)]">
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

                <div className="grid gap-4 md:grid-cols-2">
                    <div className="md:col-span-2">
                        <label className="mb-1 block text-[11px] font-medium text-[#7d6d61]">Huésped disponible</label>
                        <select
                            value={selectedGuest}
                            onChange={(event) => handleGuestSelect(event.target.value)}
                            className="h-9 w-full rounded-xl border border-[#e0d4ca] bg-[#fcfaf8] px-3 text-[12px] text-[#2b1b14] outline-none focus:border-[#b08f7c]"
                        >
                            <option value="">Selecciona un huésped</option>
                            {guestOptions.map((guest) => (
                                <option key={guest} value={guest}>{guest}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="mb-1 block text-[11px] font-medium text-[#7d6d61]">Habitación ocupada</label>
                        <select
                            value={selectedRoom}
                            onChange={(event) => handleRoomSelect(event.target.value)}
                            className="h-9 w-full rounded-xl border border-[#e0d4ca] bg-[#fcfaf8] px-3 text-[12px] text-[#2b1b14] outline-none focus:border-[#b08f7c]"
                        >
                            <option value="">Selecciona habitación</option>
                            {roomOptions.map((room) => (
                                <option key={room} value={room}>{room}</option>
                            ))}
                        </select>
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

                    <div className="md:col-span-2">
                        <div className="mb-2 flex items-center justify-between">
                            <label className="text-[11px] font-medium text-[#7d6d61]">Prendas</label>
                            <span className="text-[10px] text-[#8d7b70]">Precio fijo por unidad</span>
                        </div>

                        <div className="grid gap-2 sm:grid-cols-2">
                            {itemOptions.map((item) => {
                                const quantity = selectedItems[item] ?? 0;
                                return (
                                    <div key={item} className="rounded-xl border border-[#eadfd6] bg-[#faf5f1] p-2.5">
                                        <div className="mb-2 flex items-start justify-between gap-3">
                                            <div>
                                                <p className="text-[12px] font-semibold text-[#2b1b14]">{itemLabels[item]}</p>
                                                <p className="mt-0.5 text-[10px] text-[#8d7b70]">{fmtMoney(laundryPriceCatalog[item])} cada una</p>
                                            </div>
                                            <span className="rounded-full bg-[#efe2d7] px-2 py-1 text-[10px] font-semibold text-[#5a463a]">
                                                {quantity}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between gap-2">
                                            <button
                                                type="button"
                                                onClick={() => handleItemChange(item, -1)}
                                                disabled={quantity === 0}
                                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#dccfca] bg-white text-[16px] font-medium text-[#4b2b21] disabled:cursor-not-allowed disabled:opacity-40"
                                            >
                                                −
                                            </button>
                                            <span className="min-w-[26px] text-center text-[12px] font-semibold text-[#2b1b14]">{quantity}</span>
                                            <button
                                                type="button"
                                                onClick={() => handleItemChange(item, 1)}
                                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#dccfca] bg-white text-[16px] font-medium text-[#4b2b21]"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="md:col-span-2 rounded-[16px] border border-[#c3b5a8] bg-[#f9f0e6] p-3">
                        <div className="flex items-center justify-between gap-3">
                            <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#8d7b70]">Resumen</span>
                            <span className="text-[16px] font-bold text-[#2b1b14]">{fmtMoney(total)}</span>
                        </div>
                        <div className="mt-2 rounded-xl border border-[#eadfd6] bg-white px-3 py-2 text-[12px] text-[#2b1b14]">
                            <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8d7b70]">Descripción automática</div>
                            <p className="leading-5 text-[#2b1b14]">
                                {descriptionPreview || 'Aún no agregaste prendas a la orden.'}
                            </p>
                        </div>
                    </div>

                    <div className="md:col-span-2">
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

// ---------- Panel de detalle ----------

function LaundryDetailCard({
    laundry,
    onEdit,
    onAdvanceStatus,
    onDelete
}: {
    laundry: Laundry;
    onEdit: () => void;
    onAdvanceStatus: () => void;
    onDelete: () => void;
}): ReactElement {
    const status = laundry.status as LaundryStatus;
    const nextStatusLabel: Partial<Record<LaundryStatus, string>> = {
        PENDIENTE: 'Marcar En Proceso',
        EN_PROCESO: 'Marcar Listo',
        LISTO: 'Marcar Entregado'
    };

    return (
        <section className="flex min-h-0 w-full flex-col rounded-[26px] border border-[#eadfd6] bg-white shadow-[0_20px_50px_rgba(67,42,27,0.08)] xl:w-[380px]">
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[26px] p-4">
                <div className="mb-3 flex items-start justify-between">
                    <div>
                        <h3 className="text-[16px] font-bold tracking-tight text-[#2b1b14]">
                            {itemLabels[laundry.item as LaundryItemType]}
                        </h3>
                        <p className="text-[12px] text-[#6f6055]">Orden #{laundry.id}</p>
                    </div>
                    <StatusPill status={status} />
                </div>

                <div className="rounded-xl border border-[#ece0d7] bg-[#fcf7f1] px-4 py-3 text-[12px]">
                    <h4 className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8d7b70]">Descripción</h4>
                    <p className="text-[#2b1b14]">{laundry.description}</p>
                </div>

                <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 rounded-xl border border-[#ece0d7] bg-[#fcf7f1] px-4 py-3 text-[12px]">
                    <DetailLine label="Cliente" value={laundry.clientName} />
                    <DetailLine label="Habitación" value={laundry.roomNumber ?? '---'} />
                    <DetailLine label="Cantidad" value={String(laundry.quantity)} />
                    <DetailLine label="Precio unit." value={fmtMoney(laundry.unitPrice)} />
                </div>

                <div className="mt-2 rounded-xl border border-[#c3b5a8] bg-[#f9f0e6] px-4 py-3">
                    <h4 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8d7b70]">Cobro</h4>
                    <div className="mt-1.5 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[12px]">
                        <DetailLine label="Cant. × Precio" value={`${laundry.quantity} × ${fmtMoney(laundry.unitPrice)}`} />
                        <DetailLine label="Total" value={fmtMoney(laundry.totalPrice)} />
                    </div>
                </div>

                <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 rounded-xl border border-[#ece0d7] bg-[#fcf7f1] px-4 py-3 text-[12px]">
                    <DetailLine label="Fecha entrega" value={fmtDate(laundry.deliveryDate)} />
                    <DetailLine label="Creada" value={fmtDate(laundry.createdAt)} />
                </div>

                {laundry.notes && (
                    <div className="mt-2 rounded-xl border border-[#ece0d7] bg-[#fcf7f1] px-4 py-3 text-[12px]">
                        <h4 className="mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8d7b70]">Notas</h4>
                        <p className="text-[#2b1b14]">{laundry.notes}</p>
                    </div>
                )}

                <div className="mt-auto flex flex-col gap-2 pt-3">
                    {status !== 'ENTREGADO' && (
                        <AccentButton
                            onClick={onAdvanceStatus}
                            className="w-full gap-1.5 bg-[#4b2b21] text-white hover:bg-[#5b3428]"
                        >
                            <CheckCircle size={14} aria-hidden="true" />
                            {nextStatusLabel[status]}
                        </AccentButton>
                    )}
                    <div className="flex gap-2">
                        <AccentButton onClick={onEdit} className="flex-1 gap-1.5">
                            <PencilLine size={13} aria-hidden="true" />
                            Editar
                        </AccentButton>
                        <AccentButton
                            onClick={onDelete}
                            className="flex-1 gap-1.5 border-[#f0c8c4] bg-white text-[#d13d3d] hover:border-[#e5a0a0] hover:bg-[#fff5f5]"
                        >
                            <Trash2 size={13} aria-hidden="true" />
                            Eliminar
                        </AccentButton>
                    </div>
                </div>
            </div>
        </section>
    );
}

// ---------- Componente principal ----------

export function LavanderiaPage({ user }: { user: PublicUser }): ReactElement {
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

    function requestDelete(id: number) {
        if (isAdmin) {
            confirmDelete(id);
        } else {
            setPendingDeleteId(id);
            setShowAdminAuth(true);
        }
    }

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

    function onAdminAuthorized() {
        setShowAdminAuth(false);
        if (pendingDeleteId !== null) {
            confirmDelete(pendingDeleteId);
            setPendingDeleteId(null);
        }
    }

    if (loading) {
        return (
            <div className="flex min-h-0 flex-1 items-center justify-center bg-[#f6f1eb]">
                <div className="text-[11px] text-[#7d6d61]">Cargando lavandería...</div>
            </div>
        );
    }

    return (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[#f6f1eb] text-[#2b1b14]">
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-4">
                <div className="grid gap-2 py-2 xl:grid-cols-4">
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
                    <section className="flex min-h-0 flex-1 flex-col rounded-[20px] border border-[#eadfd6] bg-white p-3 shadow-[0_16px_40px_rgba(67,42,27,0.08)]">
                        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between w-full">
                            <div className="min-w-[200px]">
                                <h2 className="text-[13px] font-semibold text-[#2b1b14]">Órdenes de Lavandería</h2>
                            </div>

                            <div className="flex items-center gap-1.5 flex-1 justify-end overflow-x-auto">
                                <label className="flex h-8 min-w-[160px] items-center gap-1.5 rounded-xl border border-[#e0d4ca] bg-[#fcfaf8] px-2.5 text-[#8d7b70] transition focus-within:border-[#b08f7c] focus-within:bg-white">
                                    <Search size={14} aria-hidden="true" />
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(event) => setSearch(event.target.value)}
                                        placeholder="Buscar cliente, habitación..."
                                        className="w-full bg-transparent text-[10px] text-[#2b1b14] outline-none placeholder:text-[#a49486]"
                                    />
                                </label>

                                <FilterSelect
                                    label="Estado"
                                    value={statusFilter}
                                    onChange={setStatusFilter}
                                    options={statusOptions}
                                    labels={statusLabels}
                                />
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
                                    className="gap-1.5 bg-[#4b2b21] text-white hover:bg-[#5b3428] h-8 text-[11px] shrink-0"
                                >
                                    <Plus size={14} aria-hidden="true" />
                                    Nueva Orden
                                </AccentButton>
                            </div>
                        </div>

                        <div className="mt-2 flex min-h-0 flex-1 flex-col overflow-hidden rounded-[18px] border border-[#ebe1d8]">
                            <div className="grid grid-cols-[110px_1fr_120px_100px_100px_90px] gap-2 border-b border-[#ece2d8] bg-[#fbf7f2] px-3 py-2 text-[9px] font-semibold uppercase tracking-[0.18em] text-[#8f7c70] min-w-[700px]">
                                <div>Prenda</div>
                                <div>Cliente / Descripción</div>
                                <div className="text-center">Habitación</div>
                                <div className="text-center">Total</div>
                                <div className="text-center">Estado</div>
                                <div className="text-center">Acción</div>
                            </div>

                            <div className="flex-1 overflow-auto min-w-[700px]">
                                {filteredOrders.length === 0 && (
                                    <div className="flex h-32 items-center justify-center text-[11px] text-[#a49486]">
                                        No hay órdenes que coincidan con los filtros.
                                    </div>
                                )}
                                {filteredOrders.map((order) => {
                                    const isSelected = order.id === selectedOrder?.id;
                                    return (
                                        <button
                                            key={order.id}
                                            type="button"
                                            onClick={() => setSelectedId(order.id)}
                                            className={cn(
                                                'grid w-full grid-cols-[110px_1fr_120px_100px_100px_90px] items-center gap-2 border-b border-[#f1e7de] px-3 py-2.5 text-left transition last:border-b-0',
                                                isSelected ? 'bg-[#fff7ef]' : 'bg-white hover:bg-[#fdfaf7]'
                                            )}
                                        >
                                            <div className="text-[12px] font-semibold text-[#2b1b14]">
                                                {itemLabels[order.item as LaundryItemType]}
                                            </div>

                                            <div className="min-w-0">
                                                <p className="truncate text-[12px] font-medium text-[#2b1b14]">{order.clientName}</p>
                                                <p className="truncate text-[10px] text-[#8d7b70]">{order.description}</p>
                                            </div>

                                            <div className="text-center text-[11px] text-[#5d4d42]">{order.roomNumber ?? '---'}</div>

                                            <div className="text-center text-[12px] font-semibold text-[#2b1b14]">
                                                {fmtMoney(order.totalPrice)}
                                            </div>

                                            <div className="flex justify-center">
                                                <StatusPill status={order.status as LaundryStatus} />
                                            </div>

                                            <div className="flex items-center justify-center gap-1.5">
                                                <IconButton
                                                    label="Ver"
                                                    icon={Eye}
                                                    onClick={() => setSelectedId(order.id)}
                                                />
                                                <IconButton
                                                    label="Eliminar"
                                                    icon={Trash2}
                                                    danger
                                                    onClick={() => requestDelete(order.id)}
                                                />
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
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
                        <section className="flex min-h-0 w-full flex-col items-center justify-center rounded-[26px] border border-[#eadfd6] bg-white shadow-[0_20px_50px_rgba(67,42,27,0.08)] xl:w-[380px]">
                            <div className="text-center">
                                <p className="text-[13px] font-medium text-[#8d7b70]">Sin órdenes registradas</p>
                                <p className="mt-1 text-[11px] text-[#a49486]">Crea una nueva orden para comenzar</p>
                            </div>
                        </section>
                    )}
                </div>
            </div>

            {showForm && (
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
                <AdminPasswordModal
                    onSuccess={onAdminAuthorized}
                    onClose={() => {
                        setShowAdminAuth(false);
                        setPendingDeleteId(null);
                    }}
                />
            )}

            {confirmAction && (
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
