import { ChevronDown, ChevronUp, Pencil, Plus, UserX } from 'lucide-react';
import { type ReactElement, useState } from 'react';
import type { Recepcionista } from '../../lib/api';
import { StatusPill } from '../ui/StatusPill';
import { cn } from '../../lib/utils';
import { TURNO_HORAS, TURNO_LABELS } from './types';

type Props = {
  recepcionistas: Recepcionista[];
  onNueva: () => void;
  onEditar: (recepcionista: Recepcionista) => void;
  onMover: (id: number, delta: -1 | 1) => void;
};

/**
 * El orden de esta lista ES la rotación: la primera es la que abre el primer
 * turno del rango generado. Por eso hay flechas y no un campo de texto, para que
 * mover a alguien sea una acción obvia y no un número que hay que calcular.
 */
export function RecepcionistasPanel({
  recepcionistas,
  onNueva,
  onEditar,
  onMover
}: Props): ReactElement {
  const [moviendo, setMoviendo] = useState<number | null>(null);

  const ordenados = [...recepcionistas].sort((a, b) => a.posicion - b.posicion);

  async function mover(id: number, delta: -1 | 1) {
    setMoviendo(id);
    try {
      onMover(id, delta);
    } finally {
      setMoviendo(null);
    }
  }

  return (
    <aside className="flex min-h-0 flex-1 w-full lg:w-1/2 flex-col overflow-hidden rounded-[18px] border border-sapay-350 bg-white">
      <div className="flex items-center justify-between gap-2 border-b border-sapay-200 px-3 py-2 shrink-0">
        <h3 className="text-[11px] font-semibold text-sapay-950">Recepcionistas</h3>
        <button
          type="button"
          onClick={onNueva}
          className="inline-flex h-7 items-center gap-1 rounded-lg bg-sapay-900 px-2 text-[10px] font-medium text-white hover:bg-[#5b3428]"
        >
          <Plus size={12} />
          Agregar
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        {ordenados.length === 0 && (
          <p className="p-3 text-[11px] text-sapay-550">
            Aún no hay recepcionistas en el roster. Agrega tres para poder generar el semanario.
          </p>
        )}

        {ordenados.map((recepcionista, indice) => {
          const ocupada = moviendo === recepcionista.id;
          return (
            <div
              key={recepcionista.id}
              className={cn(
                'flex items-center gap-2 border-b border-sapay-200 px-3 py-2 last:border-b-0',
                !recepcionista.activo && 'bg-[#faf7f4]'
              )}
            >
              <span
                className={cn(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold',
                  recepcionista.activo
                    ? 'bg-sapay-150 text-sapay-900'
                    : 'bg-sapay-250 text-sapay-500'
                )}
                title={`Puesto ${indice + 1} de la rotación`}
              >
                {recepcionista.posicion + 1}
              </span>

              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    'truncate text-[11px] font-medium',
                    recepcionista.activo ? 'text-sapay-950' : 'text-sapay-500 line-through'
                  )}
                >
                  {recepcionista.nombre}
                </p>
                {!recepcionista.activo && (
                  <StatusPill className="mt-0.5 border-sapay-300 bg-sapay-250 px-2 py-0 text-[9px] text-sapay-600">
                    Inactiva
                  </StatusPill>
                )}
              </div>

              <div className="flex shrink-0 items-center">
                <button
                  type="button"
                  onClick={() => mover(recepcionista.id, -1)}
                  disabled={indice === 0 || ocupada}
                  className="flex h-6 w-5 items-center justify-center rounded text-sapay-600 hover:bg-sapay-150 hover:text-sapay-950 disabled:opacity-25 disabled:hover:bg-transparent"
                  title="Subir en la rotación"
                  aria-label={`Subir a ${recepcionista.nombre}`}
                >
                  <ChevronUp size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => mover(recepcionista.id, 1)}
                  disabled={indice === ordenados.length - 1 || ocupada}
                  className="flex h-6 w-5 items-center justify-center rounded text-sapay-600 hover:bg-sapay-150 hover:text-sapay-950 disabled:opacity-25 disabled:hover:bg-transparent"
                  title="Bajar en la rotación"
                  aria-label={`Bajar a ${recepcionista.nombre}`}
                >
                  <ChevronDown size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => onEditar(recepcionista)}
                  className="ml-0.5 flex h-6 w-6 items-center justify-center rounded-lg text-sapay-600 hover:bg-sapay-150 hover:text-sapay-950"
                  title="Editar"
                  aria-label={`Editar ${recepcionista.nombre}`}
                >
                  {recepcionista.activo ? <Pencil size={12} /> : <UserX size={12} />}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="shrink-0 border-t border-sapay-200 bg-[#fbf7f2] px-3 py-2 text-[9px] leading-relaxed text-sapay-600">
        <p className="font-semibold text-sapay-750">Cómo funciona la rotación</p>
        <p>
          La <strong>#1</strong> abre el primer turno del rango y de ahí van rotando. Con 3
          activas cada una trabaja 2 días seguidos y descansa 1.
        </p>
        <p className="mt-1.5">
          {TURNO_LABELS.DIA}: {TURNO_HORAS.DIA}
        </p>
        <p>
          {TURNO_LABELS.NOCHE}: {TURNO_HORAS.NOCHE}
        </p>
      </div>
    </aside>
  );
}