import { type FormEvent, type ReactElement, useState } from 'react';
import { type ParkingRates, type ParkingRatesInput } from '../../lib/api';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { formatParkingMoney } from './types';

type Props = {
  rates: ParkingRates;
  onSave: (input: ParkingRatesInput) => Promise<void>;
  onClose: () => void;
};

export function ParkingRatesModal({ rates, onSave, onClose }: Props): ReactElement {
  const [motorcycleHourlyRate, setMotorcycleHourlyRate] = useState(String(rates.motorcycleHourlyRate));
  const [carHourlyRate, setCarHourlyRate] = useState(String(rates.carHourlyRate));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const motorcycle = Number(motorcycleHourlyRate);
    const car = Number(carHourlyRate);
    if (![motorcycle, car].every((price) => Number.isSafeInteger(price) && price > 0)) {
      setError('Las tarifas deben ser valores enteros mayores que cero.');
      return;
    }
    setError('');
    setSaving(true);
    try {
      await onSave({ motorcycleHourlyRate: motorcycle, carHourlyRate: car });
      onClose();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudieron guardar las tarifas.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal onClose={onClose} title="Tarifas por hora" maxWidthClass="max-w-md">
      <form onSubmit={submit} className="space-y-3">
        <p className="text-[11px] text-sapay-650">Los nuevos valores aplican a las próximas entradas. Las sesiones abiertas conservan la tarifa con la que ingresaron.</p>
        <label className="block text-xs text-sapay-750">Moto
          <span className="relative mt-1 block">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sapay-650">$</span>
            <input type="number" min={1} step={1} required value={motorcycleHourlyRate} onChange={(event) => setMotorcycleHourlyRate(event.target.value)} className="h-10 w-full rounded-lg border border-sapay-400 bg-sapay-100 pl-7 pr-3 text-right text-sm text-sapay-950 outline-none focus:border-sapay-600" />
          </span>
        </label>
        <label className="block text-xs text-sapay-750">Carro, camioneta y camión
          <span className="relative mt-1 block">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sapay-650">$</span>
            <input type="number" min={1} step={1} required value={carHourlyRate} onChange={(event) => setCarHourlyRate(event.target.value)} className="h-10 w-full rounded-lg border border-sapay-400 bg-sapay-100 pl-7 pr-3 text-right text-sm text-sapay-950 outline-none focus:border-sapay-600" />
          </span>
        </label>
        <div className="rounded-lg border border-sapay-300 bg-[#fcf8f4] px-3 py-2 text-[11px] text-sapay-700">
          <p>Moto: {formatParkingMoney(motorcycleHourlyRate || 0)} por hora</p>
          <p>Carro: {formatParkingMoney(carHourlyRate || 0)} por hora</p>
        </div>
        {error && <p role="alert" className="rounded-lg border border-danger-200 bg-danger-100 px-3 py-2 text-[11px] text-[#b33a3a]">{error}</p>}
        <Button disabled={saving} className="h-9 w-full rounded-lg bg-sapay-900 text-xs text-white">{saving ? 'Guardando...' : 'Guardar tarifas'}</Button>
      </form>
    </Modal>
  );
}