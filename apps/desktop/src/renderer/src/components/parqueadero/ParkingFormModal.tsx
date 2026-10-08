import { type FormEvent, type ReactElement, useState } from 'react';
import { type ParkingRates, type ParkingSessionInput, type VehicleType } from '../../lib/api';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { hourlyRateForVehicle, vehicleTypeLabels, vehicleTypes, formatParkingMoney } from './types';

type Props = {
  rates: ParkingRates;
  onSubmit: (input: ParkingSessionInput) => Promise<void>;
  onClose: () => void;
};

type FormState = ParkingSessionInput;

const inputClass = 'mt-1 w-full rounded-lg border border-sapay-400 bg-sapay-100 px-3 py-2 text-xs outline-none focus:border-sapay-600 focus:bg-white';

export function ParkingFormModal({ rates, onSubmit, onClose }: Props): ReactElement {
  const [form, setForm] = useState<ParkingSessionInput>({
    ownerName: '', ownerCc: '', licensePlate: '', phone: '', vehicleLine: '',
    vehicleType: 'CARRO', notes: ''
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (![form.ownerName, form.ownerCc, form.licensePlate, form.phone, form.vehicleLine].every((value) => value.trim())) {
      setError('Completa los datos del titular y del vehículo.');
      return;
    }
    setError('');
    setSaving(true);
    try {
      await onSubmit({
        ...form,
        ownerName: form.ownerName.trim(),
        ownerCc: form.ownerCc.trim(),
        licensePlate: form.licensePlate.trim().toUpperCase(),
        phone: form.phone.trim(),
        vehicleLine: form.vehicleLine.trim(),
        notes: form.notes?.trim() || undefined
      });
      onClose();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo registrar la entrada.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal onClose={onClose} title="Registrar entrada" maxWidthClass="max-w-xl">
      <form onSubmit={submit}>
        <p className="mb-3 text-[11px] text-sapay-650">Los huéspedes activos ingresan sin cobro. A los visitantes se les cobra cada hora iniciada, mínimo una hora, al registrar la salida.</p>
        {error && <p role="alert" className="mb-3 rounded-lg border border-danger-200 bg-danger-100 px-3 py-2 text-[11px] text-[#b33a3a]">{error}</p>}
        <div className="grid grid-cols-2 gap-3">
          <label className="text-[11px] text-sapay-750">Nombre *
            <input required maxLength={120} value={form.ownerName} onChange={(event) => update('ownerName', event.target.value)} className={inputClass} />
          </label>
          <label className="text-[11px] text-sapay-750">Cédula *
            <input required maxLength={30} value={form.ownerCc} onChange={(event) => update('ownerCc', event.target.value)} className={inputClass} />
          </label>
          <label className="text-[11px] text-sapay-750">Placa *
            <input required maxLength={10} value={form.licensePlate} onChange={(event) => update('licensePlate', event.target.value)} className={inputClass} />
          </label>
          <label className="text-[11px] text-sapay-750">Teléfono *
            <input required maxLength={80} value={form.phone} onChange={(event) => update('phone', event.target.value)} className={inputClass} />
          </label>
          <label className="text-[11px] text-sapay-750">Línea del vehículo *
            <input required maxLength={80} value={form.vehicleLine} onChange={(event) => update('vehicleLine', event.target.value)} className={inputClass} />
          </label>
          <label className="text-[11px] text-sapay-750">Tipo de vehículo *
            <select value={form.vehicleType} onChange={(event) => update('vehicleType', event.target.value as VehicleType)} className={inputClass}>
              {vehicleTypes.map((type) => <option key={type} value={type}>{vehicleTypeLabels[type]}</option>)}
            </select>
          </label>
          <div className="flex items-end rounded-lg border border-sapay-300 bg-[#fcf8f4] px-3 py-2 text-xs">
            <span className="text-sapay-700">Tarifa por hora</span>
            <strong className="ml-auto text-sapay-950">{formatParkingMoney(hourlyRateForVehicle(rates, form.vehicleType))}</strong>
          </div>
          <label className="col-span-2 text-[11px] text-sapay-750">Notas
            <textarea maxLength={500} rows={2} value={form.notes ?? ''} onChange={(event) => update('notes', event.target.value)} className={inputClass} />
          </label>
        </div>
        <Button disabled={saving} className="mt-4 h-9 w-full rounded-lg bg-sapay-900 text-xs text-white">
          {saving ? 'Registrando...' : 'Registrar entrada'}
        </Button>
      </form>
    </Modal>
  );
}