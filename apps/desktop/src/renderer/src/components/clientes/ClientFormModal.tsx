import { type FormEvent, type ReactElement } from 'react';
import { type Cliente } from '../../lib/api';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
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
    <Modal
      onClose={onClose}
      title={editing ? 'Editar cliente' : 'Nuevo cliente'}
      maxWidthClass="max-w-lg"
      zIndexClass="z-40"
    >
      <form onSubmit={onSubmit}>
        <div className="grid grid-cols-2 gap-3">
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
    </Modal>
  );
}