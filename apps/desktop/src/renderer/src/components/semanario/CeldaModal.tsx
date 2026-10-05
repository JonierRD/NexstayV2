import { type ReactElement, useState } from 'react';
import type { Recepcionista, Turno } from '../../lib/api';
import { Modal } from '../ui/Modal';
import { AccentButton } from '../ui/AccentButton';
import { cn } from '../../lib/utils';
import { TURNO_HORAS, TURNO_LABELS, etiquetaFechaCorta, etiquetaSemana } from './types';
import type { CeldaEnEdicion } from './useSemanario';

type Props = {
  edicion: CeldaEnEdicion;
  recepcionistas: Recepcionista[];
  onSubmit: (datos: {
    turno: Turno;
    recepcionistaId: number;
    destacado: boolean;
    nota: string;
  }) => Promise<void>;
  onVacias: (turno: Turno, fecha: string) => Promise<void>;
  onClose: () => void;
};

export function CeldaModal({
  edicion,
  recepcionistas,
  onSubmit,
  onVacias,
  onClose
}: Props): ReactElement {
  const { celda, semana } = edicion;
  const [turno, setTurno] = useState<Turno>(celda.turno);
  const [recepcionistaId, setRecepcionistaId] = useState<string>(
    celda.recepcionistaId ? String(celda.recepcionistaId) : ''
  );
  const [destacado, setDestacado] = useState(celda.destacado);
  const [nota, setNota] = useState(celda.nota ?? '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Al cambiar de turno la celda es otra: se recargan sus datos guardados.
  function cambiarTurno(nuevo: Turno) {
    if (nuevo === turno) {
      return;
    }
    const destino = semana.celdas.find((c) => c.fecha === celda.fecha && c.turno === nuevo);
    setTurno(nuevo);
    setRecepcionistaId(destino?.recepcionistaId ? String(destino.recepcionistaId) : '');
    setDestacado(destino?.destacado ?? false);
    setNota(destino?.nota ?? '');
  }

  async function handleSubmit() {
    setError('');
    if (!recepcionistaId) {
      setError('Elige quién cubre este turno.');
      return;
    }

    setSaving(true);
    try {
      await onSubmit({ turno, recepcionistaId: Number(recepcionistaId), destacado, nota });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar la celda.');
    } finally {
      setSaving(false);
    }
  }

  async function handleVaciar() {
    setError('');
    setSaving(true);
    try {
      await onVacias(turno, celda.fecha);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al vaciar la celda.');
      setSaving(false);
    }
  }

  return (
    <Modal
      onClose={onClose}
      title={`Editar turno · ${etiquetaFechaCorta(celda.fecha)}`}
      maxWidthClass="max-w-[420px]"
    >
      <p className="text-[10px] uppercase tracking-[0.14em] text-sapay-550">
        Semana {etiquetaSemana(semana.fechaInicio, semana.fechaFin)}
      </p>

      <div className="mt-4">
        <label className="mb-1 block text-[11px] font-medium text-sapay-750">Turno</label>
        <div className="grid grid-cols-2 gap-1.5">
          {(['DIA', 'NOCHE'] as Turno[]).map((opcion) => (
            <button
              key={opcion}
              type="button"
              onClick={() => cambiarTurno(opcion)}
              className={cn(
                'rounded-xl border px-3 py-2 text-left transition',
                turno === opcion
                  ? 'border-sapay-900 bg-sapay-900 text-white'
                  : 'border-sapay-400 bg-white text-sapay-950 hover:bg-sapay-150'
              )}
            >
              <span className="block text-[12px] font-semibold">{TURNO_LABELS[opcion]}</span>
              <span
                className={cn(
                  'block text-[9px]',
                  turno === opcion ? 'text-white/70' : 'text-sapay-550'
                )}
              >
                {TURNO_HORAS[opcion]}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3">
        <label className="mb-1 block text-[11px] font-medium text-sapay-750">Recepcionista</label>
        <select
          value={recepcionistaId}
          onChange={(e) => setRecepcionistaId(e.target.value)}
          className="h-9 w-full rounded-xl border border-sapay-400 bg-sapay-100 px-3 text-[12px] text-sapay-950 outline-none focus:border-sapay-600"
        >
          <option value="">Selecciona...</option>
          {recepcionistas.map((r) => (
            <option key={r.id} value={r.id}>
              {r.nombre}
              {r.activo ? '' : ' (inactiva)'}
            </option>
          ))}
        </select>
      </div>

      <label className="mt-3 flex cursor-pointer items-center gap-2 rounded-xl border border-sapay-350 bg-[#fffaf6] px-3 py-2">
        <input
          type="checkbox"
          checked={destacado}
          onChange={(e) => setDestacado(e.target.checked)}
          className="h-3.5 w-3.5 accent-[#c94a43]"
        />
        <span className="text-[11px] text-sapay-800">
          Destacar en rojo (cambio de turno, incapacidad, novedad)
        </span>
      </label>

      <div className="mt-3">
        <label className="mb-1 block text-[11px] font-medium text-sapay-750">
          Nota (opcional)
        </label>
        <input
          type="text"
          value={nota}
          onChange={(e) => setNota(e.target.value)}
          placeholder="Ej: cubre por incapacidad de Marcela"
          className="h-9 w-full rounded-xl border border-sapay-400 bg-sapay-100 px-3 text-[12px] text-sapay-950 outline-none placeholder:text-sapay-550 focus:border-sapay-600"
        />
      </div>

      {error && (
        <div className="mt-3 rounded-xl border border-danger-200 bg-danger-100 px-3 py-2 text-[11px] text-[#b33a3a]">
          {error}
        </div>
      )}

      <div className="mt-5 flex items-center gap-2">
        {celda.recepcionistaId !== null && (
          <button
            type="button"
            onClick={handleVaciar}
            disabled={saving}
            className="text-[10px] font-medium text-danger underline disabled:opacity-50"
          >
            Dejar sin cubrir
          </button>
        )}
        <div className="flex-1" />
        <AccentButton onClick={onClose}>Cancelar</AccentButton>
        <AccentButton
          onClick={handleSubmit}
          disabled={saving}
          className="bg-sapay-900 text-white hover:bg-[#5b3428]"
        >
          {saving ? 'Guardando...' : 'Guardar'}
        </AccentButton>
      </div>
    </Modal>
  );
}