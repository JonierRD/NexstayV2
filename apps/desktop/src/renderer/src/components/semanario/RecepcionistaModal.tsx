import { type ReactElement, useState } from 'react';
import type { Recepcionista } from '../../lib/api';
import { Modal } from '../ui/Modal';
import { AccentButton } from '../ui/AccentButton';
import { ConfirmModal } from '../ui/ConfirmModal';

type Props = {
  /** Ausente cuando se está creando una nueva. */
  recepcionista?: Recepcionista;
  onSubmit: (datos: { nombre: string; notas?: string; activo?: boolean }) => Promise<void>;
  /** La saca de la rotación pero conserva su horario. */
  onDesactivar?: (id: number) => Promise<void>;
  /** La borra del roster; sus turnos quedan vacíos. */
  onEliminar?: (id: number) => Promise<void>;
  onClose: () => void;
};

export function RecepcionistaModal({
  recepcionista,
  onSubmit,
  onDesactivar,
  onEliminar,
  onClose
}: Props): ReactElement {
  const [nombre, setNombre] = useState(recepcionista?.nombre ?? '');
  const [notas, setNotas] = useState(recepcionista?.notas ?? '');
  const [activo, setActivo] = useState(recepcionista?.activo ?? true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmarDesactivar, setConfirmarDesactivar] = useState(false);
  const [confirmarEliminar, setConfirmarEliminar] = useState(false);

  async function handleSubmit() {
    setError('');
    if (nombre.trim().length < 2) {
      setError('El nombre debe tener al menos 2 caracteres.');
      return;
    }

    setSaving(true);
    try {
      await onSubmit({ nombre: nombre.trim(), notas: notas.trim() || undefined, activo });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar la recepcionista.');
      setSaving(false);
    }
  }

  async function handleDesactivar() {
    if (!recepcionista || !onDesactivar) {
      return;
    }
    setSaving(true);
    try {
      await onDesactivar(recepcionista.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al desactivar la recepcionista.');
      setSaving(false);
      setConfirmarDesactivar(false);
    }
  }

  async function handleEliminar() {
    if (!recepcionista || !onEliminar) {
      return;
    }
    setSaving(true);
    try {
      await onEliminar(recepcionista.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar la recepcionista.');
      setSaving(false);
      setConfirmarEliminar(false);
    }
  }

  return (
    <>
      <Modal
        onClose={onClose}
        title={recepcionista ? 'Editar recepcionista' : 'Nueva recepcionista'}
        maxWidthClass="max-w-[420px]"
      >
        <div>
          <label className="mb-1 block text-[11px] font-medium text-sapay-750">Nombre</label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Sofía"
            autoFocus
            className="h-9 w-full rounded-xl border border-sapay-400 bg-sapay-100 px-3 text-[12px] text-sapay-950 outline-none placeholder:text-sapay-550 focus:border-sapay-600"
          />
        </div>

        {recepcionista && (
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-sapay-350 bg-[#fdfaf6] px-3 py-2">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sapay-150 text-[11px] font-semibold text-sapay-900">
              {recepcionista.posicion + 1}
            </span>
            <p className="text-[10px] leading-snug text-sapay-700">
              Va en el puesto <strong>{recepcionista.posicion + 1}</strong> de la rotación.
              Muévela con las flechas del panel para cambiar quién abre el primer turno.
            </p>
          </div>
        )}

        <div className="mt-3">
          <label className="mb-1 block text-[11px] font-medium text-sapay-750">
            Nota (opcional)
          </label>
          <input
            type="text"
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            placeholder="Ej: cubre fines de semana"
            className="h-9 w-full rounded-xl border border-sapay-400 bg-sapay-100 px-3 text-[12px] text-sapay-950 outline-none placeholder:text-sapay-550 focus:border-sapay-600"
          />
        </div>

        {recepcionista && (
          <label className="mt-3 flex cursor-pointer items-center gap-2 rounded-xl border border-sapay-350 bg-[#fffaf6] px-3 py-2">
            <input
              type="checkbox"
              checked={activo}
              onChange={(e) => setActivo(e.target.checked)}
              className="h-3.5 w-3.5 accent-[#2f8f4e]"
            />
            <span className="text-[11px] text-sapay-800">
              Activa (participa en la rotación automática)
            </span>
          </label>
        )}

        {error && (
          <div className="mt-3 rounded-xl border border-danger-200 bg-danger-100 px-3 py-2 text-[11px] text-[#b33a3a]">
            {error}
          </div>
        )}

        <div className="mt-5 flex items-center gap-2">
          {recepcionista && onDesactivar && onEliminar && (
            <div className="flex items-center gap-2">
              {recepcionista.activo && (
                <button
                  type="button"
                  onClick={() => setConfirmarDesactivar(true)}
                  disabled={saving}
                  className="text-[10px] font-medium text-sapay-750 underline disabled:opacity-50"
                  title="Deja de participar en la rotación, pero conserva su horario"
                >
                  Desactivar
                </button>
              )}
              <button
                type="button"
                onClick={() => setConfirmarEliminar(true)}
                disabled={saving}
                className="text-[10px] font-medium text-danger underline disabled:opacity-50"
                title="La borra del roster; sus turnos quedan vacíos"
              >
                Eliminar
              </button>
            </div>
          )}
          <div className="flex-1" />
          <AccentButton onClick={onClose}>Cancelar</AccentButton>
          <AccentButton
            onClick={handleSubmit}
            disabled={saving}
            className="bg-sapay-900 text-white hover:bg-[#5b3428]"
          >
            {saving ? 'Guardando...' : recepcionista ? 'Guardar' : 'Agregar'}
          </AccentButton>
        </div>
      </Modal>

      {confirmarDesactivar && (
        <ConfirmModal
          title="¿Desactivar esta recepcionista?"
          message="Deja de participar en la rotación. Su horario ya generado se conserva, y podés reactivarla desde acá."
          confirmLabel="Sí, desactivar"
          confirmDanger
          onConfirm={handleDesactivar}
          onClose={() => setConfirmarDesactivar(false)}
        />
      )}

      {confirmarEliminar && (
        <ConfirmModal
          title="¿Eliminar esta recepcionista?"
          message="Se borra del roster. Los turnos que tenía quedan vacíos y no se reasignan solos; tenés que llenarlos a mano. No se puede deshacer."
          confirmLabel="Sí, eliminar"
          confirmDanger
          onConfirm={handleEliminar}
          onClose={() => setConfirmarEliminar(false)}
        />
      )}
    </>
  );
}