import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  type ModoGeneracion,
  type Recepcionista,
  type SemanaSemanario,
  type Turno,
  actualizarRecepcionistaRequest,
  borrarCeldaRequest,
  crearRecepcionistaRequest,
  desactivarRecepcionistaRequest,
  eliminarRecepcionistaRequest,
  eliminarSemanaRequest,
  generarRangoRequest,
  guardarCeldaRequest,
  guardarSemanaRequest,
  reordenarRosterRequest,
  semanarioRequest,
  vaciarTurnosRequest,
  vaciarSemanaRequest,
  vaciarSemanarioRequest
} from '../../lib/api';
import { type CeldaSemanario, claveCelda, hoyIso, indexarCeldas } from './types';

export type CeldaEnEdicion = {
  semana: SemanaSemanario;
  celda: CeldaSemanario;
};

export type RangoForm = { desde: string; hasta: string; modo: ModoGeneracion };

export function useSemanario(puedeEditar: boolean) {
  const [recepcionistas, setRecepcionistas] = useState<Recepcionista[]>([]);
  const [semanas, setSemanas] = useState<SemanaSemanario[]>([]);
  const [rango, setRango] = useState<{ desde: string; hasta: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  /**
   * Aviso de éxito. Sin librería de notificaciones en la app, el resultado de
   * una generación necesita un lugar donde verse: un "listo" genérico esconde
   * justo lo que el administrador quiere saber, cuánto se agregó y cuánto se
   * respetó.
   */
  const [aviso, setAviso] = useState('');

  const [celdaEnEdicion, setCeldaEnEdicion] = useState<CeldaEnEdicion | null>(null);
  const [semanaEnEdicion, setSemanaEnEdicion] = useState<SemanaSemanario | null>(null);
  const [showGenerar, setShowGenerar] = useState(false);
  const [recepcionistaEnEdicion, setRecepcionistaEnEdicion] = useState<Recepcionista | null>(null);
  const [showNuevaRecepcionista, setShowNuevaRecepcionista] = useState(false);

  const hoy = hoyIso();

  const cargar = useCallback(() => {
    setLoading(true);
    semanarioRequest()
      .then((data) => {
        setRecepcionistas(data.recepcionistas);
        setSemanas(data.semanas);
        setRango(data.rango);
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : 'Error al cargar el semanario.')
      )
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // Índice de celdas por semana. Se recalcula solo cuando cambian los datos.
  const celdasPorSemana = useMemo(
    () => new Map(semanas.map((semana) => [semana.id, indexarCeldas(semana)])),
    [semanas]
  );

  const activas = useMemo(() => recepcionistas.filter((r) => r.activo), [recepcionistas]);

  const stats = useMemo(() => {
    const posibles = semanas.length * 14;
    const cubiertas = semanas.reduce(
      (total, semana) => total + semana.celdas.filter((c) => c.recepcionistaId !== null).length,
      0
    );
    const destacadas = semanas.reduce(
      (total, semana) => total + semana.celdas.filter((c) => c.destacado).length,
      0
    );
return {
      semanas: semanas.length,
      recepcionistas: recepcionistas.length,
      activas: activas.length,
      posibles,
      cubiertas,
      destacadas,
      cobertura: posibles ? Math.round((cubiertas / posibles) * 100) : 0
    };
  }, [semanas, activas]);

  /** Semana que contiene hoy, para poder resaltar y saltar a ella. */
  const semanaDeHoy = useMemo(
    () => semanas.find((s) => s.fechaInicio <= hoy && s.fechaFin >= hoy) ?? null,
    [semanas, hoy]
  );

  // ---------- Edición del horario ----------

  function abrirCelda(semana: SemanaSemanario, fecha: string, turno: Turno) {
    if (!puedeEditar) {
      return;
    }
    const celda =
      celdasPorSemana.get(semana.id)?.get(claveCelda(fecha, turno)) ??
      ({ fecha, turno, recepcionistaId: null, nombre: null, destacado: false, nota: null } as CeldaSemanario);
    setCeldaEnEdicion({ semana, celda });
  }

  async function guardarCelda(datos: {
    turno: Turno;
    recepcionistaId: number;
    destacado: boolean;
    nota: string;
  }) {
    if (!celdaEnEdicion) {
      return;
    }
    await guardarCeldaRequest({
      semanaId: celdaEnEdicion.semana.id,
      fecha: celdaEnEdicion.celda.fecha,
      ...datos
    });
    setCeldaEnEdicion(null);
    cargar();
  }

  async function vaciarCelda(turno: Turno, fecha: string) {
    if (!celdaEnEdicion) {
      return;
    }
    await borrarCeldaRequest(celdaEnEdicion.semana.id, fecha, turno);
    setCeldaEnEdicion(null);
    cargar();
  }

  function abrirSemana(semana: SemanaSemanario) {
    if (!puedeEditar) {
      return;
    }
    setSemanaEnEdicion(semana);
  }

  async function guardarSemana(asignaciones: Array<{
    fecha: string;
    turno: Turno;
    recepcionistaId: number;
    destacado: boolean;
    nota: string | null;
  }>) {
    if (!semanaEnEdicion) {
      return;
    }
    await guardarSemanaRequest({
      semanaId: semanaEnEdicion.id,
      // El backend no distingue "sin nota" de null: se omite el campo.
      asignaciones: asignaciones.map((a) => ({ ...a, nota: a.nota ?? undefined }))
    });
    setSemanaEnEdicion(null);
    cargar();
  }

  // ---------- Rango y roster ----------

  async function generarRango(form: RangoForm) {
    const resultado = await generarRangoRequest(form);
    setShowGenerar(false);
    await cargar();

    // El backend ya devuelve el desglose, así que el mensaje dice qué pasó de
    // verdad en vez de un "listo" genérico que no aclara nada.
const partes = [`${resultado.semanasCreadas} semanas nuevas`];
    if (resultado.celdasNuevas) partes.push(`${resultado.celdasNuevas} turnos agregados`);
    if (resultado.celdasRespetadas) partes.push(`${resultado.celdasRespetadas} sin tocar`);
    if (resultado.celdasReemplazadas) partes.push(`${resultado.celdasReemplazadas} recalculados`);

    setAviso(`${partes.join(', ')}.`);
  }

/** La deja de participar en la rotación; conserva su horario histórico. */
  async function desactivarRecepcionista(id: number) {
    await desactivarRecepcionistaRequest(id);
    setRecepcionistaEnEdicion(null);
    cargar();
  }

  /** La borra del roster. Los turnos que tenía quedan vacíos. */
  async function eliminarRecepcionista(id: number) {
    const resultado = await eliminarRecepcionistaRequest(id);
    setRecepcionistaEnEdicion(null);
    await cargar();
    setAviso(resultado.message);
  }

  /** El mismo modal sirve para alta y edición, así que decide según el estado. */
  async function guardarRecepcionista(datos: {
    nombre: string;
    notas?: string;
    activo?: boolean;
  }) {
    if (recepcionistaEnEdicion) {
      await actualizarRecepcionistaRequest(recepcionistaEnEdicion.id, datos);
      setRecepcionistaEnEdicion(null);
    } else {
      await crearRecepcionistaRequest({ nombre: datos.nombre, notas: datos.notas });
      setShowNuevaRecepcionista(false);
    }
    cargar();
  }

  function cerrarRecepcionista() {
    setShowNuevaRecepcionista(false);
    setRecepcionistaEnEdicion(null);
  }

  /**
   * Mueve una persona un puesto dentro de la rotación. Se manda la lista
   * completa: el backend la renumera densa y así `posicion` nunca queda con
   * huecos aunque antes se hayan borrado o desactivado personas.
   */
  async function moverEnLaRotacion(id: number, delta: -1 | 1) {
    const ordenados = [...recepcionistas].sort((a, b) => a.posicion - b.posicion);
    const indice = ordenados.findIndex((r) => r.id === id);
    const destino = indice + delta;
    if (indice < 0 || destino < 0 || destino >= ordenados.length) {
      return;
    }

    [ordenados[indice], ordenados[destino]] = [ordenados[destino], ordenados[indice]];
    await reordenarRosterRequest(ordenados.map((r) => r.id));
    cargar();
  }

  // ---------- Vaciar y eliminar ----------

  async function vaciarSemana(semanaId: number) {
    await vaciarSemanaRequest(semanaId);
    setSemanaEnEdicion(null);
    cargar();
  }

  async function eliminarSemana(semanaId: number) {
    await eliminarSemanaRequest(semanaId);
    setSemanaEnEdicion(null);
    cargar();
  }

  async function vaciarTodo() {
    await vaciarSemanarioRequest();
    setSemanaEnEdicion(null);
    setCeldaEnEdicion(null);
    cargar();
  }

/**
 * Vacía los turnos y deja el grid en blanco. No toca las semanas ni las
 * recepcionistas: el roster es lo caro de reconstruir a mano.
 */
  async function vaciarTurnos() {
    const resultado = await vaciarTurnosRequest();
    setSemanaEnEdicion(null);
    setCeldaEnEdicion(null);
    await cargar();
    setAviso(
      `Se vaciaron los ${resultado.turnos} turnos. ` +
        `Las ${resultado.roster} recepcionistas y las ${resultado.semanas} semanas siguen en el grid.`
    );
  }

  return {
    loading,
error,
  aviso,
    recepcionistas,
    activas,
    semanas,
    rango,
    stats,
    hoy,
    semanaDeHoy,
    celdasPorSemana,
    puedeEditar,

    celdaEnEdicion,
    abrirCelda,
    guardarCelda,
    vaciarCelda,
    cerrarCelda: () => setCeldaEnEdicion(null),

    semanaEnEdicion,
    abrirSemana,
    guardarSemana,
    cerrarSemana: () => setSemanaEnEdicion(null),

    showGenerar,
    setShowGenerar,
    generarRango,

    recepcionistaEnEdicion,
    setRecepcionistaEnEdicion,
    showNuevaRecepcionista,
    setShowNuevaRecepcionista,
    guardarRecepcionista,
    desactivarRecepcionista,
  eliminarRecepcionista,
    cerrarRecepcionista,
    moverEnLaRotacion,

    vaciarSemana,
    eliminarSemana,
    vaciarTodo,
  vaciarTurnos,

    recargar: cargar
  };
}