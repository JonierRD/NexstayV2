import { type FormEvent, type ReactElement } from 'react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { ROLE_LABEL, type UserFormState, type UserRole } from './useUsuarios';

const inputClass =
  'w-full rounded-lg border border-sapay-400 bg-sapay-100 px-3 py-2 text-xs outline-none focus:border-sapay-600 focus:bg-white';

type Props = {
  editing: boolean;
  form: UserFormState;
  setForm: (form: UserFormState) => void;
  saving: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
};

export function UserFormModal({ editing, form, setForm, saving, onSubmit, onClose }: Props): ReactElement {
  return (
    <Modal
      onClose={onClose}
      title={editing ? 'Editar usuario' : 'Nuevo usuario'}
      maxWidthClass="max-w-lg"
      zIndexClass="z-40"
    >
      <form onSubmit={onSubmit}>
        <div className="grid grid-cols-2 gap-3">
          {editing && (
            <p className="col-span-2 rounded-lg bg-sapay-100 px-3 py-2 text-[10px] text-[#7a6a60]">
              La contraseña la administra cada usuario desde su Perfil; aquí solo se editan sus datos.
            </p>
          )}

          <label className="col-span-2 text-[11px] text-sapay-750">
            Nombre completo *
            <input
              value={form.fullName}
              required
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              className={`${inputClass} mt-1`}
            />
          </label>

          <label className="text-[11px] text-sapay-750">
            Cédula *
            <input
              value={form.cc}
              required
              disabled={editing}
              onChange={(e) => setForm({ ...form, cc: e.target.value })}
              className={`${inputClass} mt-1 disabled:opacity-60`}
            />
          </label>

          <label className="text-[11px] text-sapay-750">
            Teléfono
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className={`${inputClass} mt-1`}
            />
          </label>

          <label className="col-span-2 text-[11px] text-sapay-750">
            Correo electrónico *
            <input
              type="email"
              value={form.email}
              required
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className={`${inputClass} mt-1`}
            />
          </label>

          <label className="col-span-2 text-[11px] text-sapay-750">
            Rol *
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
              className={`${inputClass} mt-1`}
            >
              {(Object.keys(ROLE_LABEL) as UserRole[]).map((role) => (
                <option key={role} value={role}>
                  {ROLE_LABEL[role]}
                </option>
              ))}
            </select>
          </label>

          {!editing && (
            <>
              <label className="text-[11px] text-sapay-750">
                Contraseña provisional *
                <input
                  type="password"
                  value={form.initialPassword}
                  required
                  onChange={(e) => setForm({ ...form, initialPassword: e.target.value })}
                  className={`${inputClass} mt-1`}
                />
              </label>
              <label className="text-[11px] text-sapay-750">
                Confirmar contraseña *
                <input
                  type="password"
                  value={form.confirmPassword}
                  required
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  className={`${inputClass} mt-1`}
                />
              </label>
            </>
          )}
        </div>

        <Button disabled={saving} className="mt-4 h-9 w-full rounded-lg bg-sapay-900 text-xs text-white">
          {saving ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear usuario'}
        </Button>
      </form>
    </Modal>
  );
}