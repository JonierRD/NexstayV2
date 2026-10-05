import { CalendarPlus, CalendarRange, Search, UserCog } from 'lucide-react';
import { type ReactElement, useMemo, useState } from 'react';
import type { PublicUser } from '../lib/api';
import { Role } from '../routes/roles';
import { SearchInput } from '../components/ui/SearchInput';
import { StatCard } from '../components/ui/StatCard';
import { AccentButton } from '../components/ui/AccentButton';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { StatusPill } from '../components/ui/StatusPill';
import { CeldaModal } from '../components/semanario/CeldaModal';
import { GenerarRangoModal } from '../components/semanario/GenerarRangoModal';
import { RecepcionistaModal } from '../components/semanario/RecepcionistaModal';
import { RecepcionistasPanel } from '../components/semanario/RecepcionistasPanel';
import { SemanaModal } from '../components/semanario/SemanaModal';
import { SemanarioGrid } from '../components/semanario/SemanarioGrid';
import { useSemanario } from '../components/semanario/useSemanario';
import { TURNO_HORAS, TURNO_LABELS, etiquetaRango } from '../components/semanario/types';

export function SemanarioPage({ user }: { user: PublicUser }): ReactElement {
  // El rol decide qué se ve, pero la validación real está en AdminGuard: acá solo
  // se esconden los controles de escritura.
  const puedeEditar = user?.role === Role.ADMIN;
  const s = useSemanario(puedeEditar);
  const [busqueda, setBusqueda] = useState('');
  const [confirmarEliminarSemanario, setConfirmarEliminarSemanario] = useState(false);
  const [confirmarVaciarTurnos, setConfirmarVaciarTurnos] = useState(false);

  // Filtra semanas por nombre de recepcionista; para filtrar el roster entero.
  const semanas = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    if (!termino) {
      return s.semanas;
    }
    return s.semanas
      .map((semana) => ({
        ...semana,
        celdas: semana.celdas.filter((celda) =>
          (celda.nombre ?? '').toLowerCase().includes(termino)
        )
      }))
      .filter((semana) => semana.celdas.length > 0);
  }, [s.semanas, busqueda]);

  if (s.loading) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center bg-sapay-250">
        <div className="text-[11px] text-sapay-750">Cargando semanario...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-sapay-250 text-sapay-950">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-4">
        <div className="grid gap-2 py-2 xl:grid-cols-4">
          <StatCard
            icon={CalendarRange}
            title="Rango"
            value={s.rango ? etiquetaRango(s.rango.desde, s.rango.hasta) : 'Sin definir'}
            detail={s.rango ? 'Periodo generado' : 'Genera un rango para empezar'}
            tone="from-[#f0dfc9] to-[#f7efe4]"
          />
          <StatCard
            icon={CalendarPlus}
            title="Semanas"
            value={String(s.stats.semanas)}
            detail="Domingo a sábado"
            tone="from-[#dbe8f5] to-[#eef5fc]"
          />
          <StatCard
            icon={UserCog}
            title="Recepcionistas"
            value={`${s.stats.activas} activas`}
            detail={`${s.recepcionistas.length} en el roster`}
            tone="from-[#d9efdd] to-[#eefaf0]"
          />
          <StatCard
            icon={Search}
            title="Cobertura"
            value={`${s.stats.cobertura}%`}
            detail={`${s.stats.cubiertas} de ${s.stats.posibles} turnos`}
            tone="from-[#f3e2c8] to-[#fff5df]"
          />
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-3 pb-3 xl:flex-row">
          <section className="flex min-h-0 flex-1 flex-col rounded-[20px] border border-sapay-350 bg-white p-3 shadow-[0_16px_40px_rgba(67,42,27,0.08)]">
            <div className="flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
              <div className="min-w-[200px]">
                <h2 className="text-[13px] font-semibold text-sapay-950">Horario semanal</h2>
                <p className="mt-0.5 flex items-center gap-1.5 text-[9px] text-sapay-550">
                  {TURNO_LABELS.DIA} {TURNO_HORAS.DIA} · {TURNO_LABELS.NOCHE}{' '}
                  {TURNO_HORAS.NOCHE}
                  {!puedeEditar && (
                    <StatusPill className="border-sapay-300 bg-sapay-150 text-sapay-700">
                      Solo lectura
                    </StatusPill>
                  )}
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                <SearchInput
                  value={busqueda}
                  onChange={setBusqueda}
                  placeholder="Filtrar por recepcionista..."
                />
                {puedeEditar && s.stats.semanas > 0 && (
                  <button
                    type="button"
                    onClick={() => setConfirmarEliminarSemanario(true)}
                    className="h-8 shrink-0 rounded-lg border border-danger-150 px-2 text-[10px] font-medium text-[#b33a3a] hover:bg-danger-50"
                    title="Borrar las semanas y todos los turnos. Las recepcionistas se conservan."
                  >
                    Eliminar semanario
                  </button>
                )}
                {puedeEditar && s.stats.cubiertas > 0 && (
                  <button
                    type="button"
                    onClick={() => setConfirmarVaciarTurnos(true)}
                    className="h-8 shrink-0 rounded-lg border border-danger-150 px-2 text-[10px] font-medium text-[#b33a3a] hover:bg-danger-50"
                    title="Quitar a todos del horario. Las semanas y las recepcionistas se conservan."
                  >
                    Vaciar turnos
                  </button>
                )}
                {puedeEditar && (
                  <AccentButton
                    onClick={() => s.setShowGenerar(true)}
                    className="h-8 shrink-0 gap-1.5 bg-sapay-900 text-[11px] text-white hover:bg-[#5b3428]"
                  >
                    <CalendarPlus size={14} aria-hidden="true" />
                    {s.stats.semanas ? 'Ampliar rango' : 'Generar rango'}
                  </AccentButton>
                )}
              </div>
            </div>

            {s.error && (
              <div className="mt-2 rounded-xl border border-danger-200 bg-danger-100 px-3 py-2 text-[11px] text-[#b33a3a]">
                {s.error}
              </div>
            )}

            {s.aviso && (
              <div className="mt-2 rounded-xl border border-sapay-400 bg-[#f2f7f2] px-3 py-2 text-[11px] text-sapay-800">
                {s.aviso}
              </div>
            )}

            {s.stats.semanas === 0 ? (
              <div className="mt-2 flex min-h-0 flex-1 flex-col items-center justify-center rounded-[18px] border border-dashed border-sapay-350 bg-[#fdfbf8] p-6 text-center">
                <p className="text-[13px] font-medium text-sapay-650">El semanario aún no existe</p>
                <p className="mt-1 max-w-sm text-[11px] text-sapay-550">
                  {puedeEditar
                    ? 'Define el rango de fechas y el sistema arma las semanas con la rotación de las 3 recepcionistas.'
                    : 'El administrador todavía no ha generado el horario. Vuelve más tarde.'}
                </p>
                {puedeEditar && (
                  <AccentButton
                    onClick={() => s.setShowGenerar(true)}
                    className="mt-4 gap-1.5 bg-sapay-900 text-white hover:bg-[#5b3428] h-8 text-[11px]"
                  >
                    <CalendarPlus size={14} aria-hidden="true" />
                    Generar rango
                  </AccentButton>
                )}
              </div>
            ) : (
              <SemanarioGrid
                semanas={semanas}
                celdasPorSemana={s.celdasPorSemana}
                rango={s.rango}
                hoy={s.hoy}
                puedeEditar={puedeEditar}
                onSelectCelda={s.abrirCelda}
                onSelectSemana={s.abrirSemana}
              />
            )}
          </section>

          {puedeEditar && (
            <RecepcionistasPanel
              recepcionistas={s.recepcionistas}
              onNueva={() => s.setShowNuevaRecepcionista(true)}
              onEditar={s.setRecepcionistaEnEdicion}
              onMover={(id, delta) => void s.moverEnLaRotacion(id, delta)}
            />
          )}
        </div>
      </div>

      {confirmarEliminarSemanario && (
        <ConfirmModal
          title="¿Eliminar el semanario?"
          message={`Se borran las ${s.stats.semanas} semanas y los ${s.stats.cubiertas} turnos. Las ${s.stats.recepcionistas} recepcionistas se conservan. No se puede deshacer.`}
          confirmLabel="Sí, eliminar el semanario"
          confirmDanger
          onConfirm={async () => {
            try {
              await s.vaciarTodo();
            } finally {
              setConfirmarEliminarSemanario(false);
            }
          }}
          onClose={() => setConfirmarEliminarSemanario(false)}
        />
      )}

      {confirmarVaciarTurnos && (
        <ConfirmModal
          title="¿Vaciar los turnos?"
          message={`Se quitan los ${s.stats.cubiertas} turnos y el horario queda en blanco. Las ${s.stats.recepcionistas} recepcionistas y las ${s.stats.semanas} semanas se conservan, así que después podés volver a generarlo o llenarlo a mano.`}
          confirmLabel="Sí, vaciar turnos"
          confirmDanger
          onConfirm={async () => {
            try {
              await s.vaciarTurnos();
            } finally {
              setConfirmarVaciarTurnos(false);
            }
          }}
          onClose={() => setConfirmarVaciarTurnos(false)}
        />
      )}

      {s.showGenerar && (
        <GenerarRangoModal
          rangoActual={s.rango}
          semanasExistentes={semanas.map((w) => w.fechaInicio)}
          activas={s.stats.activas}
          onSubmit={s.generarRango}
          onClose={() => s.setShowGenerar(false)}
        />
      )}

      {s.celdaEnEdicion && (
        <CeldaModal
          edicion={s.celdaEnEdicion}
          recepcionistas={s.recepcionistas}
          onSubmit={s.guardarCelda}
          onVacias={s.vaciarCelda}
          onClose={s.cerrarCelda}
        />
      )}

      {s.semanaEnEdicion && (
        <SemanaModal
          semana={s.semanaEnEdicion}
          recepcionistas={s.recepcionistas}
          onSubmit={s.guardarSemana}
          onVaciar={() => s.vaciarSemana(s.semanaEnEdicion!.id)}
          onEliminar={() => s.eliminarSemana(s.semanaEnEdicion!.id)}
          onClose={s.cerrarSemana}
        />
      )}

      {(s.showNuevaRecepcionista || s.recepcionistaEnEdicion) && (
        <RecepcionistaModal
          recepcionista={s.recepcionistaEnEdicion ?? undefined}
          onSubmit={s.guardarRecepcionista}
          onDesactivar={s.recepcionistaEnEdicion ? s.desactivarRecepcionista : undefined}
          onEliminar={s.recepcionistaEnEdicion ? s.eliminarRecepcionista : undefined}
          onClose={s.cerrarRecepcionista}
        />
      )}
    </div>
  );
}