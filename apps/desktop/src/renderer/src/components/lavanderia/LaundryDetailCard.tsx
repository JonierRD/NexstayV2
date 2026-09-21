import { CheckCircle, PencilLine, Trash2 } from 'lucide-react';
import { type ReactElement } from 'react';
import { type Laundry } from '../../lib/api';
import { AccentButton } from '../ui/accent-button';
import { DetailLine } from '../ui/detail-line';
import { StatusPill } from '../ui/status-pill';
import {
    type LaundryItemType,
    type LaundryStatus,
    itemLabels,
    statusLabels,
    statusStyles,
    fmtDate,
    fmtMoney
} from './types';

type Props = {
    laundry: Laundry;
    onEdit: () => void;
    onAdvanceStatus: () => void;
    onDelete: () => void;
};

export function LaundryDetailCard({
    laundry,
    onEdit,
    onAdvanceStatus,
    onDelete
}: Props): ReactElement {
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
                    <StatusPill className={statusStyles[status]}>{statusLabels[status]}</StatusPill>
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