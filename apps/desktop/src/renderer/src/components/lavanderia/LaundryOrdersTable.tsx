import { Eye, Trash2 } from 'lucide-react';
import { type ReactElement } from 'react';
import { type Laundry } from '../../lib/api';
import { cn } from '../../lib/utils';
import { IconButton } from '../ui/icon-button';
import { StatusPill } from '../ui/status-pill';
import {
    type LaundryItemType,
    type LaundryStatus,
    itemLabels,
    statusLabels,
    statusStyles,
    fmtMoney
} from './types';

type Props = {
    orders: Laundry[];
    selectedId: number | null;
    onSelect: (id: number) => void;
    onDelete: (id: number) => void;
};

export function LaundryOrdersTable({ orders, selectedId, onSelect, onDelete }: Props): ReactElement {
    return (
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
                {orders.length === 0 && (
                    <div className="flex h-32 items-center justify-center text-[11px] text-[#a49486]">
                        No hay órdenes que coincidan con los filtros.
                    </div>
                )}
                {orders.map((order) => {
                    const isSelected = order.id === selectedId;
                    return (
                        <button
                            key={order.id}
                            type="button"
                            onClick={() => onSelect(order.id)}
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
                                <StatusPill className={statusStyles[order.status as LaundryStatus]}>{statusLabels[order.status as LaundryStatus]}</StatusPill>
                            </div>

                            <div className="flex items-center justify-center gap-1.5">
                                <IconButton
                                    label="Ver"
                                    icon={Eye}
                                    onClick={() => onSelect(order.id)}
                                />
                                <IconButton
                                    label="Eliminar"
                                    icon={Trash2}
                                    danger
                                    onClick={() => onDelete(order.id)}
                                />
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}