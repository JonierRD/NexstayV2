import { X } from 'lucide-react';
import { type FormEvent, type ReactElement } from 'react';
import { type Cliente } from '../../lib/api';
import { Button } from '../ui/button';
import { type FormState } from './types';

const inputClass = 'w-full rounded-lg border border-sapay-400 bg-sapay-100 px-3 py-2 text-xs outline-none focus:border-sapay-600 focus:bg-white';

const fields: ReadonlyArray<[keyof FormState, string, boolean]> = [
  ['firstName', 'Nombre *', true],
  ['lastName', 'Apellido *', true],
  ['cc', 'Cédula *', true],
  ['phone', 'Teléfono', false],
  ['cityOrigin', 'Ciudad de origen', false],
  ['cityDestination', 'Ciudad de destino', false],
  ['profession', 'Profesión', false]
];

type Props = {
  editing: Cliente | null;
  form: FormState;
  setForm: (form: FormState) => void;
  saving: boolean;
  onSubmit: (event: FormEvent) => void;
  onClose: () => void;
};

export function ClientFormModal({ editing, form, setForm, saving, onSubmit, onClose }: Props): ReactElement {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
      <form onSubmit={onSubmit} className="relative w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl">
        <button type="button" onClick={onClose} className="absolute right-3 top-3 text-sapay-650">
          <X size={18} />
        </button>
        <h2 className="text-base font-semibold">{editing ? 'Editar cliente' : 'Nuevo cliente'}</h2>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {fields.map(([key, label, required]) => (
            <label key={key} className="text-[11px] text-sapay-750">
              {label}
              <input
                value={form[key] ?? ''}
                disabled={key === 'cc' && !!editing}
                required={required}
                onChange={(event) => setForm({ ...form, [key]: event.target.value })}
                className={`${inputClass} mt-1 disabled:opacity-60`}
              />
            </label>
          ))}
          <label className="col-span-2 text-[11px] text-sapay-750">
            Notas
            <textarea
              value={form.notes ?? ''}
              onChange={(event) => setForm({ ...form, notes: event.target.value })}
              className={`${inputClass} mt-1`}
              rows={3}
            />
          </label>
        </div>
        <Button disabled={saving} className="mt-4 h-9 w-full rounded-lg bg-sapay-900 text-xs text-white">
          {saving ? 'Guardando...' : 'Guardar cliente'}
        </Button>
      </form>
    </div>
  );
}