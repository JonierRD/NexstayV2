import { formatCOP, formatDateShort } from '../../lib/format';

export type LaundryStatus = 'PENDIENTE' | 'EN_PROCESO' | 'LISTO' | 'ENTREGADO';
export type LaundryItemType = 'CAMISA' | 'PANTALON' | 'TOALLA' | 'SABANA' | 'FUNDAS_ALMOHADA' | 'EDREDON' | 'OTRO';

export const statusStyles: Record<LaundryStatus, string> = {
    PENDIENTE: 'bg-[#fff5df] text-gold border-[#f2dbab]',
    EN_PROCESO: 'bg-[#eaf1fb] text-[#2f6f9f] border-[#c6dcf0]',
    LISTO: 'bg-success-50 text-success border-success-100',
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

export const itemPluralLabels: Record<LaundryItemType, string> = {
    CAMISA: 'camisas',
    PANTALON: 'pantalones',
    TOALLA: 'toallas',
    SABANA: 'sábanas',
    FUNDAS_ALMOHADA: 'fundas de almohada',
    EDREDON: 'edredones',
    OTRO: 'otras prendas'
};

export const itemPrices: Record<LaundryItemType, number> = {
    CAMISA: 1000,
    PANTALON: 3000,
    TOALLA: 1000,
    SABANA: 3000,
    FUNDAS_ALMOHADA: 1000,
    EDREDON: 5000,
    OTRO: 1000
};

const LAUNDRY_PRICES_STORAGE_KEY = 'sapay-laundry-prices';

export function loadLaundryPrices(): Record<LaundryItemType, number> {
    try {
        const storedPrices = localStorage.getItem(LAUNDRY_PRICES_STORAGE_KEY);
        if (!storedPrices) return { ...itemPrices };

        const parsed = JSON.parse(storedPrices) as Partial<Record<LaundryItemType, unknown>>;
        return Object.fromEntries(itemOptions.map((item) => {
            const price = parsed[item];
            return [item, typeof price === 'number' && Number.isSafeInteger(price) && price > 0 ? price : itemPrices[item]];
        })) as Record<LaundryItemType, number>;
    } catch {
        return { ...itemPrices };
    }
}

export function saveLaundryPrices(prices: Record<LaundryItemType, number>): void {
    localStorage.setItem(LAUNDRY_PRICES_STORAGE_KEY, JSON.stringify(prices));
}

export function parseLaundryItemCounts(
    description: string,
    fallbackItem?: LaundryItemType,
    fallbackQuantity = 0
): Record<LaundryItemType, number> {
    const counts = Object.fromEntries(itemOptions.map((item) => [item, 0])) as Record<LaundryItemType, number>;
    for (const item of itemOptions) {
        const match = new RegExp(`(?:^|,\\s*)(\\d+)\\s+${itemPluralLabels[item]}\\b`, 'i').exec(description);
        if (match) counts[item] = Number(match[1]);
    }
    if (Object.values(counts).every((count) => count === 0) && fallbackItem && fallbackQuantity > 0) {
        counts[fallbackItem] = fallbackQuantity;
    }
    return counts;
}

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
    clientName: string;
    roomNumber: string;
    notes: string;
    status: LaundryStatus;
    deliveryDate: string;
};

export const emptyForm: LaundryFormState = {
    clientName: '',
    roomNumber: '',
    notes: '',
    status: 'PENDIENTE',
    deliveryDate: ''
};