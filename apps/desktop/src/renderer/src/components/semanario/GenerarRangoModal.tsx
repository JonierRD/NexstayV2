import { type ReactElement, useState } from 'react';
import { Modal } from '../ui/Modal';
import { AccentButton } from '../ui/AccentButton';
import type { ModoGeneracion } from '../../lib/api/semanario';
import { TURNO_HORAS, TURNO_LABELS, etiquetaRango } from './types';

type Props = {
  /** Rango ya generado, para proponerlo como punto de partida. */
  rangoActual: { desde: string; hasta: string } | null;
  /** Domingos de las semanas que ya existen, para decir cuántas son nuevas. */
  semanasExistentes: string[];
  activas: number;
  onSubmit: (form: { desde: string; hasta: string; modo: ModoGeneracion }) => Promise<void>;
  onClose: () => void;
};

const MS_DIA = 86_400_000;

/** Solo acepta "AAAA-MM-DD" completo: un input de fecha vacío o a medio escribir no debe romper los cálculos. */
function esIso(valor: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(valor);
}

function sumarMeses(iso: string, meses: number): string {
  const [anio, mes, dia] = iso.split('-').map(Number);
  const fecha = new Date(Date.UTC(anio, mes - 1 + meses, dia));
  const mesIso = String(fecha.getUTCMonth() + 1).padStart(2, '0');
  const diaIso = String(fecha.getUTCDate()).padStart(2, '0');
  return `${fecha.getUTCFullYear()}-${mesIso}-${diaIso}`;
}

function sumarDias(iso: string, dias: number): string {
  const [anio, mes, dia] = iso.split('-').map(Number);
  const fecha = new Date(Date.UTC(anio, mes - 1, dia + dias));
  const mesIso = String(fecha.getUTCMonth() + 1).padStart(2, '0');
  const diaIso = String(fecha.getUTCDate()).padStart(2, '0');
  return `${fecha.getUTCFullYear()}-${mesIso}-${diaIso}`;
}

/** Domingo de la semana a la que pertenece la fecha. */
function domingoDe(iso: string): string {
  const [anio, mes, dia] = iso.split('-').map(Number);
  const fecha = new Date(Date.UTC(anio, mes - 1, dia));
  return sumarDias(iso, -fecha.getUTCDay());
}

/** Días entre dos fechas ISO, inclusive. `Date.UTC` evita el corrimiento por zona horaria. */
function diasEntre(desdeIso: string, hastaIso: string): number {
  const [a1, m1, d1] = desdeIso.split('-').map(Number);
  const [a2, m2, d2] = hastaIso.split('-').map(Number);
  return Math.round((Date.UTC(a2, m2 - 1, d2) - Date.UTC(a1, m1 - 1, d1)) / MS_DIA) + 1;
}

/**
 * Domingo siguiente al último día agendado. Se propone el domingo COMPLETO
 * posterior, no el domingo de la semana del último día: si el rango terminó un
 * jueves, esa semana ya tiene columnas y volver a empezar ahí solaparía.
 */
function domingoSiguiente(ultimoDia: string): string {
  return sumarDias(sumarDias(domingoDe(ultimoDia), 6), 1);
}

export function GenerarRangoModal({
  rangoActual,
  semanasExistentes,
  activas,
  onSubmit,
  onClose
}: Props): ReactElement {
  const [desde, setDesde] = useState(rangoActual ? domingoSiguiente(rangoActual.hasta) : '');
  const [hasta, setHasta] = useState(rangoActual ? sumarMeses(rangoActual.hasta, 1) : '');
  const [modo, setModo] = useState<ModoGeneracion>('completar');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const ok = esIso(desde) && esIso(hasta);
  const invertido = ok && diasEntre(desde, hasta) <= 0;
  const diasAsignables = ok && !invertido ? diasEntre(desde, hasta) : 0;

  // Las semanas que se crearán: el bloque va de domingo a sábado, así que
  // pueden empezar antes de `desde` o terminar después de `hasta`. Eso no es un
  // error, por eso el botón nunca se bloquea por esto.
  const domingoInicial = ok ? domingoDe(desde) : '';
  const domingoFinal = ok ? domingoDe(hasta) : '';
  const domingos: string[] = [];
  if (ok) {
    for (let dia = domingoInicial; diasEntre(dia, domingoFinal) > 0; dia = sumarDias(dia, 7)) {
      domingos.push(dia);
    }
  }

  const semanas = domingos.length;
  const semanasNuevas = domingos.filter((d) => !semanasExistentes.includes(d)).length;
  const semanasRepetidas = semanas - semanasNuevas;

  const desbordesAntes = ok ? diasEntre(domingoInicial, desde) - 1 : 0;
  const desbordesDespues = ok ? diasEntre(hasta, sumarDias(domingoFinal, 6)) - 1 : 0;

  const faltaRoster = activas !== 3;
  const puedeGenerar = ok && !invertido && !saving;

  async function handleSubmit() {
    setError('');
    if (!ok) {
      setError('Indica las dos fechas del rango.');
      return;
    }
    if (invertido) {
      setError('La fecha final debe ser igual o posterior a la de inicio.');
      return;
    }

    setSaving(true);
    try {
      await onSubmit({ desde, hasta, modo });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al generar el semanario.');
      setSaving(false);
    }
  }

  return (
    <Modal onClose={onClose} title="Generar semanario" maxWidthClass="max-w-[480px]">
      <p className="text-[11px] text-sapay-700">
        Elige el periodo y el sistema arma las semanas de domingo a sábado con la rotación de
        las 3 recepcionistas. No importa si el rango cae en domingo: los días que queden por
        fuera se crean vacíos para que los completes cuando quieras.
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-[11px] font-medium text-sapay-750">Desde</label>
          <input
            type="date"
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
            className="h-9 w-full rounded-xl border border-sapay-400 bg-sapay-100 px-3 text-[12px] text-sapay-950 outline-none focus:border-sapay-600"
          />
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-medium text-sapay-750">Hasta</label>
          <input
            type="date"
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
            className="h-9 w-full rounded-xl border border-sapay-400 bg-sapay-100 px-3 text-[12px] text-sapay-950 outline-none focus:border-sapay-600"
          />
        </div>
      </div>

      {ok && !invertido && (
        <div className="mt-3 rounded-xl border border-sapay-350 bg-[#f9f0e6] px-3 py-2 text-[11px] text-sapay-800">
          <p>
            <span className="font-semibold">{semanas}</span>{' '}
            {semanas === 1 ? 'semana' : 'semanas'} del{' '}
            {etiquetaRango(domingoInicial, sumarDias(domingoFinal, 6))}
          </p>
          <p className="mt-0.5 text-[10px] text-sapay-650">
            Turnos del <strong>{etiquetaRango(desde, hasta)}</strong>:{' '}
            <strong>{diasAsignables * 2}</strong> ({diasAsignables}{' '}
            {diasAsignables === 1 ? 'día' : 'días'}).
          </p>
          {semanasRepetidas > 0 && (
            <p className="mt-0.5 text-[10px] text-sapay-650">
              {semanasRepetidas === semanas ? (
                <>Las {semanas} semanas ya existen: solo se llenan los días que falten.</>
              ) : (
                <>
                  {semanasNuevas} semana{semanasNuevas === 1 ? '' : 's'} nueva
                  {semanasNuevas === 1 ? '' : 's'} y {semanasRepetidas} que ya existían.
                </>
              )}
            </p>
          )}
          {(desbordesAntes > 0 || desbordesDespues > 0) && (
            <p className="mt-0.5 text-[10px] text-[#8a6410]">
              Los {desbordesAntes} día{desbordesAntes === 1 ? '' : 's'} de antes y los{' '}
              {desbordesDespues} de después quedan vacíos, para que los completes a mano si los
              necesitas.
            </p>
          )}
        </div>
      )}

      {invertido && (
        <div className="mt-3 rounded-xl border border-danger-200 bg-danger-100 px-3 py-2 text-[11px] text-[#b33a3a]">
          La fecha final tiene que ser igual o posterior a la de inicio.
        </div>
      )}

      <div className="mt-3 rounded-xl border border-sapay-350 bg-white px-3 py-2 text-[10px] text-sapay-700">
        <p className="font-semibold text-sapay-850">Rotación</p>
        <p className="mt-0.5">
          {TURNO_LABELS.DIA} {TURNO_HORAS.DIA} · {TURNO_LABELS.NOCHE} {TURNO_HORAS.NOCHE}
        </p>
        <p className="mt-0.5">2 días de trabajo y 1 de descanso, por recepcionista.</p>
      </div>

      {faltaRoster && (
        <div className="mt-3 rounded-xl border border-gold/40 bg-[#fff5df] px-3 py-2 text-[11px] text-[#8a6410]">
          La rotación automática necesita exactamente 3 recepcionistas activas y hay {activas}.
          Mientras tanto puedes generar el rango y llenarlo celda por celda.
        </div>
      )}

      <fieldset className="mt-3">
        <legend className="mb-1 text-[11px] font-medium text-sapay-750">
          Qué hacer con los turnos que ya están puesta
        </legend>

        <label
          className={`flex cursor-pointer items-start gap-2 rounded-xl border px-3 py-2 ${
            modo === 'completar' ? 'border-sapay-600 bg-[#f2f7f2]' : 'border-sapay-350 bg-white'
          }`}
        >
          <input
            type="radio"
            name="modo"
            checked={modo === 'completar'}
            onChange={() => setModo('completar')}
            className="mt-0.5 h-3.5 w-3.5 accent-[#5b7f5b]"
          />
          <span className="text-[11px] text-sapay-800">
            <strong className="block">Solo llenar lo que falta</strong>
            <span className="text-[10px] text-sapay-650">
              No toca nada de lo que ya está. Es lo que usas para ampliar el horario: generas un
              mes, y al mes siguiente pones las fechas nuevas.
            </span>
          </span>
        </label>

        <label
          className={`mt-2 flex cursor-pointer items-start gap-2 rounded-xl border px-3 py-2 ${
            modo === 'rehacer' ? 'border-danger-150 bg-danger-50' : 'border-sapay-350 bg-white'
          }`}
        >
          <input
            type="radio"
            name="modo"
            checked={modo === 'rehacer'}
            onChange={() => setModo('rehacer')}
            className="mt-0.5 h-3.5 w-3.5 accent-[#c94a43]"
          />
          <span className="text-[11px] text-[#b33a3a]">
            <strong className="block">Recalcular todo el rango</strong>
            <span className="text-[10px] text-[#a0564f]">
              Vuelve a calcular cada turno del periodo, aunque ya tenga a alguien. Se pierden los
              ajustes manuales de esos días.
            </span>
          </span>
        </label>
      </fieldset>

      {error && (
        <div className="mt-3 rounded-xl border border-danger-200 bg-danger-100 px-3 py-2 text-[11px] text-[#b33a3a]">
          {error}
        </div>
      )}

      <div className="mt-5 flex justify-end gap-2">
        <AccentButton onClick={onClose}>Cancelar</AccentButton>
        <AccentButton
          onClick={handleSubmit}
          disabled={!puedeGenerar}
          className="bg-sapay-900 text-white hover:bg-[#5b3428]"
        >
          {saving ? 'Generando...' : 'Generar'}
        </AccentButton>
      </div>
    </Modal>
  );
}