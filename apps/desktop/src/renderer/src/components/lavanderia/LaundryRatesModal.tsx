import { X } from 'lucide-react';
import { type ReactElement, useState } from 'react';
import { AccentButton } from '../ui/AccentButton';
import {
    type LaundryItemType,
    itemLabels,
    itemOptions
} from './types';

type Props = {
    prices: Record<LaundryItemType, number>;
    onSave: (prices: Record<LaundryItemType, number>) => Promise<boolean>;
    onClose: () => void;
};

export function LaundryRatesModal({ prices, onSave, onClose }: Props): ReactElement {
    const [draft, setDraft] = useState(prices);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    function updatePrice(item: LaundryItemType, value: string) {
        const price = value === '' ? 0 : Number(value);
        setDraft((current) => ({ ...current, [item]: price }));
    }

    async function handleSave() {
        if (itemOptions.some((item) => !Number.isSafeInteger(draft[item]) || draft[item] <= 0)) {
            setError('Cada tarifa debe ser un valor entero mayor que cero.');
            return;
        }
        setSaving(true);
        try {
            if (!await onSave(draft)) {
                setError('No se pudieron actualizar todas las órdenes. Intenta guardar las tarifas de nuevo.');
                return;
            }
            onClose();
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-md rounded-[20px] border border-sapay-350 bg-white p-5 shadow-[0_24px_60px_rgba(67,42,27,0.18)]">
                <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-[15px] font-semibold text-sapay-950">Tarifas de lavandería</h3>
                    <button type="button" onClick={onClose} aria-label="Cerrar" className="flex h-8 w-8 items-center justify-center rounded-full text-sapay-650 hover:bg-sapay-250">
                        <X size={16} aria-hidden="true" />
                    </button>
                </div>

                <p className="mb-3 text-[11px] text-sapay-650">Los cambios aplican a órdenes nuevas; las existentes conservan su total.</p>

                {error && <p role="alert" className="mb-3 rounded-lg border border-danger-200 bg-danger-100 px-3 py-2 text-[11px] text-[#b33a3a]">{error}</p>}

                <div className="max-h-[55vh] space-y-2 overflow-y-auto">
                    {itemOptions.map((item) => (
                        <label key={item} className="grid grid-cols-[1fr_minmax(120px,160px)] items-center gap-3 rounded-lg border border-sapay-250 px-3 py-2">
                            <span className="text-[12px] font-medium text-sapay-900">{itemLabels[item]}</span>
                            <span className="relative">
                                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[12px] text-sapay-600">$</span>
                                <input
                                    type="number"
                                    min={1}
                                    step={1}
                                    value={draft[item] || ''}
                                    onChange={(event) => updatePrice(item, event.target.value)}
                                    aria-label={`Tarifa de ${itemLabels[item]}`}
                                    className="h-9 w-full rounded-lg border border-sapay-350 bg-sapay-100 pl-7 pr-2 text-right text-[12px] text-sapay-950 outline-none focus:border-sapay-600"
                                />
                            </span>
                        </label>
                    ))}
                </div>

                <div className="mt-5 flex justify-end gap-2">
                    <AccentButton onClick={onClose}>Cancelar</AccentButton>
                    <AccentButton onClick={handleSave} className="bg-sapay-900 text-white hover:bg-[#5b3428]">{saving ? 'Actualizando...' : 'Guardar tarifas'}</AccentButton>
                </div>
            </div>
        </div>
    );
}