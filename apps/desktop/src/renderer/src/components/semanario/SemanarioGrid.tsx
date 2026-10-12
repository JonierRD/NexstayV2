import { type ReactElement } from 'react';
import type { SemanaSemanario, Turno } from '../../lib/api';
import { cn } from '../../lib/utils';
import {
  DIAS_SEMANA,
  TURNO_HORAS,
  type CeldaSemanario,
  claveCelda,
  etiquetaFila,
  etiquetaFechaCorta,
  etiquetaSemana,
  nombreCorto
} from './types';

type Props = {
  semanas: SemanaSemanario[];
  celdasPorSemana: Map<number, Map<string, CeldaSemanario>>;
  rango: { desde: string; hasta: string } | null;
  hoy: string;
  puedeEditar: boolean;
  onSelectCelda: (semana: SemanaSemanario, fecha: string, turno: Turno) => void;
  onSelectSemana: (semana: SemanaSemanario) => void;
};

const GRID = 'grid-cols-[120px_repeat(7,minmax(118px,1fr))]';

function sumarDias(iso: string, dias: number): string {
  const [anio, mes, dia] = iso.split('-').map(Number);
  const fecha = new Date(Date.UTC(anio, mes - 1, dia + dias));
  const mesIso = String(fecha.getUTCMonth() + 1).padStart(2, '0');
  const diaIso = String(fecha.getUTCDate()).padStart(2, '0');
  return `${fecha.getUTCFullYear()}-${mesIso}-${diaIso}`;
}

/** Un turno dentro de la celda del día: arriba el día, abajo la noche. */
function TurnoCelda({
  nombre,
  turno,
  interactivo,
  destacado,
  tieneNota,
  onClick
}: {
  nombre: string | null;
  turno: Turno;
  interactivo: boolean;
  destacado: boolean;
  tieneNota: boolean;
  onClick: () => void;
}) {
  const contenido = (
    <span
      className={cn(
        'semanario-turno flex min-h-[22px] items-center gap-1 px-1.5 py-0.5 text-[10px] leading-tight',
        turno === 'DIA' ? 'font-semibold text-sapay-950' : 'text-[#7a6a60]',
        destacado && 'rounded-md bg-danger-50 ring-1 ring-inset ring-danger-150',
        interactivo && 'cursor-pointer'
      )}
    >
      {nombre ? (
        <span className="truncate">{nombreCorto(nombre)}</span>
      ) : (
        <span className="text-[#c3b5a8]">sin cubrir</span>
      )}
      {destacado && (
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-danger" title="Destacado" />
      )}
      {tieneNota && !destacado && (
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-gold" title="Tiene nota" />
      )}
    </span>
  );

  if (!interactivo) {
    return contenido;
  }

  return (
    <button type="button" onClick={onClick} className="block w-full text-left" title="Editar celda">
      {contenido}
    </button>
  );
}

export function SemanarioGrid({
  semanas,
  celdasPorSemana,
  rango,
  hoy,
  puedeEditar,
  onSelectCelda,
  onSelectSemana
}: Props): ReactElement {
  return (
    <div className="semanario-grid flex min-h-0 flex-1 flex-col overflow-auto rounded-[18px] border border-sapay-350 bg-white">
      <div className="min-w-[960px]">
        <div className={cn('semanario-grid-header sticky top-0 z-10 grid gap-px border-b border-sapay-300 bg-sapay-350 shadow-sm', GRID)}>
          <div className="semanario-grid-header-cell px-2 py-2 text-[9px] font-bold uppercase tracking-[0.14em] text-sapay-700">
            Semana
          </div>
          {DIAS_SEMANA.map((dia) => (
            <div key={dia} className="semanario-grid-header-cell px-2 py-1.5 text-center">
              <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-sapay-700">{dia}</p>
              <div className="mt-1 flex items-center justify-center gap-1.5 text-[8px] text-sapay-550">
                <span>{TURNO_HORAS.DIA}</span>
                <span className="h-2.5 border-l border-sapay-400" />
                <span>{TURNO_HORAS.NOCHE}</span>
              </div>
            </div>
          ))}
        </div>

        {semanas.length === 0 ? (
          <div className="flex h-40 items-center justify-center text-[11px] text-sapay-550">
            Todavía no hay semanas generadas.
          </div>
        ) : (
          <div>
            {semanas.map((semana) => {
              const celdas = celdasPorSemana.get(semana.id);
              const contieneHoy = semana.fechaInicio <= hoy && semana.fechaFin >= hoy;
              const fondoHoy = 'bg-[#fdf6e6]';
              const fila = etiquetaFila(semana, rango);
              const bloqueCompleto = fila !== etiquetaSemana(semana.fechaInicio, semana.fechaFin);

              return (
                <div
                  key={semana.id}
                  className={cn(
                    'grid gap-px border-b border-sapay-200 last:border-b-0 bg-sapay-200',
                    GRID
                  )}
                >
                  <button
                    type="button"
                    onClick={() => onSelectSemana(semana)}
                    disabled={!puedeEditar}
                    className={cn(
                      'flex flex-col items-start justify-center gap-0.5 px-2 py-2 text-left',
                      'semanario-week-label',
                      contieneHoy && 'semanario-today',
                      puedeEditar && 'cursor-pointer'
                    )}
                    title={puedeEditar ? 'Editar la semana completa' : undefined}
                  >
                    <span className="text-[10px] font-semibold text-sapay-950">
                      {fila}
                    </span>
                    <span className="text-[8px] uppercase tracking-wider text-sapay-550">
                      Sem. {semana.numeroSemana}
                    </span>
                    {bloqueCompleto && (
                      <span
                        className="text-[8px] text-sapay-500"
                        title={`El bloque de la semana va de domingo a sábado: ${etiquetaFechaCorta(
                          semana.fechaInicio
                        )} a ${etiquetaFechaCorta(semana.fechaFin)}`}
                      >
                        dom {etiquetaFechaCorta(semana.fechaInicio)} – sáb{' '}
                        {etiquetaFechaCorta(semana.fechaFin)}
                      </span>
                    )}
                  </button>

                  {DIAS_SEMANA.map((_, columna) => {
                    const fecha = sumarDias(semana.fechaInicio, columna);
                    const esHoy = fecha === hoy;

                    return (
                      <div
                        key={fecha}
                        className={cn(
                          'semanario-day-cell flex flex-col justify-stretch py-0',
                          esHoy && 'semanario-today'
                        )}
                      >
                        <div className="flex flex-1 flex-col justify-center px-0.5 py-1">
                          <TurnoCelda
                            nombre={celdas?.get(claveCelda(fecha, 'DIA'))?.nombre ?? null}
                            turno="DIA"
                            interactivo={puedeEditar}
                            destacado={celdas?.get(claveCelda(fecha, 'DIA'))?.destacado ?? false}
                            tieneNota={Boolean(celdas?.get(claveCelda(fecha, 'DIA'))?.nota)}
                            onClick={() => onSelectCelda(semana, fecha, 'DIA')}
                          />
                        </div>

                        {/* La raya del medio: separa el turno de día del de noche
                            dentro del mismo día, que si no se leen como una sola
                            celda y no se sabe quién cierra. */}
                        <div className="mx-1 border-t border-sapay-350" />

                        <div
                          className={cn(
                            'semanario-night flex flex-1 flex-col justify-center px-0.5 py-1',
                            esHoy && 'semanario-today'
                          )}
                        >
                          <TurnoCelda
                            nombre={celdas?.get(claveCelda(fecha, 'NOCHE'))?.nombre ?? null}
                            turno="NOCHE"
                            interactivo={puedeEditar}
                            destacado={celdas?.get(claveCelda(fecha, 'NOCHE'))?.destacado ?? false}
                            tieneNota={Boolean(celdas?.get(claveCelda(fecha, 'NOCHE'))?.nota)}
                            onClick={() => onSelectCelda(semana, fecha, 'NOCHE')}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}