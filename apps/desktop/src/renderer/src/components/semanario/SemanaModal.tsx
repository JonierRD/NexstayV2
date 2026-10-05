import { Fragment, type ReactElement, useState } from 'react';
import type { Recepcionista, SemanaSemanario, Turno } from '../../lib/api';
import { Modal } from '../ui/Modal';
import { AccentButton } from '../ui/AccentButton';
import { ConfirmModal } from '../ui/ConfirmModal';
import { cn } from '../../lib/utils';
import { TURNO_HORAS, TURNO_LABELS, claveCelda, etiquetaSemana } from './types';

type Props = {
  semana: SemanaSemanario;
  recepcionistas: Recepcionista[];
  onSubmit: (asignaciones: Array<{
    fecha: string;
    turno: Turno;
    recepcionistaId: number;
    destacado: boolean;
    nota: string | null;
  }>) => Promise<void>;
  /** Vacía los 14 turnos y deja la semana en el grid, sin horario. */
  onVaciar: () => Promise<void>;
  /** Elimina la semana del grid. */
  onEliminar: () => Promise<void>;
  onClose: () => void;
};

type Borrador = Record<string, { recepcionistaId: string; destacado: boolean; nota: string | null }>;

function borradorInicial(semana: SemanaSemanario): Borrador {
  const borrador: Borrador = {};
  for (const celda of semana.celdas) {
    borrador[claveCelda(celda.fecha, celda.turno)] = {
      recepcionistaId: celda.recepcionistaId ? String(celda.recepcionistaId) : '',
      destacado: celda.destacado,
      nota: celda.nota
    };
  }
  return borrador;
}

/**
 * Edición de la semana completa. Solo se envían las celdas con alguien
 * asignado: las que se dejen en "sin cubrir" se vacían en el backend, que
 * reemplaza el conjunto entero de la semana.
 */
export function SemanaModal({
  semana,
  recepcionistas,
  onSubmit,
  onVaciar,
  onEliminar,
  onClose
}: Props): ReactElement {
  const [borrador, setBorrador] = useState<Borrador>(() => borradorInicial(semana));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmar, setConfirmar] = useState<'vaciar' | 'eliminar' | null>(null);

  const dias = [...new Set(semana.celdas.map((c) => c.fecha))].sort();

  function setCampo(clave: string, cambios: Partial<{ recepcionistaId: string; destacado: boolean }>) {
    setBorrador((prev) => ({
      ...prev,
      [clave]: { ...prev[clave], ...cambios }
    }));
  }

  async function handleSubmit() {
    setError('');
    setSaving(true);
    try {
      const asignaciones = Object.entries(borrador)
        .filter(([, valor]) => valor.recepcionistaId !== '')
        .map(([clave, valor]) => {
          const [fecha, turno] = clave.split('|') as [string, Turno];
          return {
            fecha,
            turno,
            recepcionistaId: Number(valor.recepcionistaId),
            destacado: valor.destacado,
            nota: valor.nota
          };
        });

      if (!asignaciones.length) {
        setError('Deja al menos un turno asignado antes de guardar.');
        setSaving(false);
        return;
      }

      await onSubmit(asignaciones);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar la semana.');
      setSaving(false);
    }
  }

  return (
    <Modal
      onClose={onClose}
      title={`Editar semana · ${etiquetaSemana(semana.fechaInicio, semana.fechaFin)}`}
      maxWidthClass="max-w-[640px]"
    >
      <div className="-mx-1 max-h-[52vh] overflow-auto px-1">
        <table className="w-full border-separate border-spacing-y-1">
          <thead>
            <tr className="text-[9px] font-bold uppercase tracking-[0.14em] text-sapay-650">
              <th className="w-[92px] pb-1 text-left">Día</th>
              <th className="pb-1 text-left">
                {TURNO_LABELS.DIA}
                <span className="ml-1 font-normal normal-case text-sapay-500">
                  {TURNO_HORAS.DIA}
                </span>
              </th>
              <th className="w-8 pb-1" />
              <th className="pb-1 text-left">
                {TURNO_LABELS.NOCHE}
                <span className="ml-1 font-normal normal-case text-sapay-500">
                  {TURNO_HORAS.NOCHE}
                </span>
              </th>
              <th className="w-8 pb-1" />
            </tr>
          </thead>
          <tbody>
            {dias.map((fecha) => (
              <tr key={fecha} className="text-[11px]">
                <td className="pr-2 align-middle font-semibold text-sapay-950">
                  {new Intl.DateTimeFormat('es-CO', { weekday: 'long' }).format(
                    new Date(`${fecha}T12:00:00Z`)
                  )}
                  <span className="block text-[9px] font-normal text-sapay-550">{fecha}</span>
                </td>
                {(['DIA', 'NOCHE'] as Turno[]).map((turno) => {
                  const clave = claveCelda(fecha, turno);
                  const valor = borrador[clave];
                  return (
                    <Fragment key={clave}>
                      <td className="align-middle">
                        <select
                          value={valor?.recepcionistaId ?? ''}
                          onChange={(e) =>
                            setCampo(clave, { recepcionistaId: e.target.value })
                          }
                          className="h-8 w-full rounded-lg border border-sapay-400 bg-white px-2 text-[11px] text-sapay-950 outline-none focus:border-sapay-600"
                        >
                          <option value="">Sin cubrir</option>
                          {recepcionistas.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.nombre}
                              {r.activo ? '' : ' (inactiva)'}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="pl-1 align-middle">
                        <input
                          type="checkbox"
                          checked={valor?.destacado ?? false}
                          onChange={(e) => setCampo(clave, { destacado: e.target.checked })}
                          className="h-3.5 w-3.5 accent-[#c94a43]"
                          title="Destacar"
                        />
                      </td>
                    </Fragment>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className={cn('mt-2 text-[10px]', error ? 'text-[#b33a3a]' : 'text-sapay-550')}>
        {error || 'Las celdas que dejes en "Sin cubrir" se vacían al guardar.'}
      </p>

      <div className="mt-4 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setConfirmar('vaciar')}
          disabled={saving}
          className="rounded-lg border border-sapay-350 px-2 py-1 text-[10px] font-medium text-sapay-750 hover:bg-sapay-100 disabled:opacity-50"
          title="Quitar todas las asignaciones de esta semana"
        >
          Vaciar semana
        </button>
        <button
          type="button"
          onClick={() => setConfirmar('eliminar')}
          disabled={saving}
          className="rounded-lg border border-danger-150 px-2 py-1 text-[10px] font-medium text-[#b33a3a] hover:bg-danger-50 disabled:opacity-50"
          title="Quitar la semana del semanario"
        >
          Eliminar semana
        </button>

        <div className="flex-1" />

        <AccentButton onClick={onClose}>Cancelar</AccentButton>
        <AccentButton
          onClick={handleSubmit}
          disabled={saving}
          className="bg-sapay-900 text-white hover:bg-[#5b3428]"
        >
          {saving ? 'Guardando...' : 'Guardar Semana'}
        </AccentButton>
      </div>

      {confirmar && (
        <ConfirmModal
          title={confirmar === 'vaciar' ? '¿Vaciar esta semana?' : '¿Eliminar esta semana?'}
          message={
            confirmar === 'vaciar'
              ? `Se quitan los 14 turnos de la semana del ${etiquetaSemana(
                  semana.fechaInicio,
                  semana.fechaFin
                )}. La semana sigue en el semanario, pero vacía.`
              : `La semana del ${etiquetaSemana(
                  semana.fechaInicio,
                  semana.fechaFin
                )} desaparece del semanario con todos sus turnos.`
          }
          confirmLabel={confirmar === 'vaciar' ? 'Sí, vaciar' : 'Sí, eliminar'}
          confirmDanger
          onConfirm={async () => {
            try {
              if (confirmar === 'vaciar') {
                await onVaciar();
              } else {
                await onEliminar();
              }
            } catch (err) {
              setError(err instanceof Error ? err.message : 'No se pudo completar la operación.');
              setSaving(false);
              setConfirmar(null);
            }
          }}
          onClose={() => setConfirmar(null)}
        />
      )}
    </Modal>
  );
}