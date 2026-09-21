import { formatCOP, formatDateShort } from '../../lib/format';

export type LaundryStatus = 'PENDIENTE' | 'EN_PROCESO' | 'LISTO' | 'ENTREGADO';
export type LaundryItemType = 'CAMISA' | 'PANTALON' | 'TOALLA' | 'SABANA' | 'FUNDAS_ALMOHADA' | 'EDREDON' | 'OTRO';

export const statusStyles: Record<LaundryStatus, string> = {
    PENDIENTE: 'bg-[#fff5df] text-[#c78b14] border-[#f2dbab]',
    EN_PROCESO: 'bg-[#eaf1fb] text-[#2f6f9f] border-[#c6dcf0]',
    LISTO: 'bg-[#e9f6eb] text-[#2f8f4e] border-[#c6e8cf]',
    ENTREGADO: 'bg-[#f5efe9] text-[#8f5e3d] border-[#dcc5b1]'
};

export const statusLabels: Record<LaundryStatus, string> = {
    PENDIENTE: 'Pendiente',
    EN_PROCESO: 'En Proceso',
    LISTO: 'Listo',
    ENTREGADO: 'Entregado'
};

export const itemLabels: Record<LaundryItemType, string> = {
    CAMISA: 'Camisa',
    PANTALON: 'Pantalón',
    TOALLA: 'Toalla',
    SABANA: 'Sábana',
    FUNDAS_ALMOHADA: 'Fundas de Almohada',
    EDREDON: 'Edredón',
    OTRO: 'Otro'
};

export const itemOptions: LaundryItemType[] = ['CAMISA', 'PANTALON', 'TOALLA', 'SABANA', 'FUNDAS_ALMOHADA', 'EDREDON', 'OTRO'];
export const statusOptions: LaundryStatus[] = ['PENDIENTE', 'EN_PROCESO', 'LISTO', 'ENTREGADO'];

export function fmtMoney(n: number): string {
    return formatCOP(n);
}

export function fmtDate(iso: string | null): string {
    if (!iso) return '---';
    return formatDateShort(iso);
}

export type LaundryFormState = {
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

export const emptyForm: LaundryFormState = {
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