import { apiRequest } from './client';

export type Turno = 'DIA' | 'NOCHE';

export type Recepcionista = {
  id: number;
  userId: string | null;
  nombre: string;
  /** Índice crudo dentro del roster. Puede tener huecos si se quitaron personas. */
  orden: number;
  /** Posición en la rotación ya normalizada (0, 1, 2...). Es la que se muestra. */
  posicion: number;
  activo: boolean;
  notas: string | null;
  createdAt: string;
  updatedAt: string;
};

/** Siempre llegan las 14 de cada semana (7 días × 2 turnos), tenga o no gente. */
export type CeldaSemanario = {
  fecha: string;
  turno: Turno;
  recepcionistaId: number | null;
  nombre: string | null;
  destacado: boolean;
  nota: string | null;
};

export type SemanaSemanario = {
  id: number;
  fechaInicio: string;
  fechaFin: string;
  anio: number;
  numeroSemana: number;
  notas: string | null;
  celdas: CeldaSemanario[];
};

export type SemanarioResponse = {
  recepcionistas: Recepcionista[];
  rango: { desde: string; hasta: string } | null;
  semanas: SemanaSemanario[];
};

export type AsignacionInput = {
  fecha: string;
  turno: Turno;
  recepcionistaId: number;
  destacado?: boolean;
  nota?: string;
};

export async function semanarioRequest(filtros?: {
  desde?: string;
  hasta?: string;
}): Promise<SemanarioResponse> {
  const query = new URLSearchParams();
  if (filtros?.desde) query.set('desde', filtros.desde);
  if (filtros?.hasta) query.set('hasta', filtros.hasta);
  const suffix = query.toString() ? `?${query.toString()}` : '';
  return apiRequest<SemanarioResponse>(`/semanario${suffix}`, { method: 'GET' });
}

/**
 * Qué hacer con las celdas del rango que ya están ocupadas. `completar` es el
 * normal al ampliar el horario mes a mes: respeta lo editado a mano.
 */
export type ModoGeneracion = 'completar' | 'rehacer';

export type ResultadoGenerarRango = {
  rango: { desde: string; hasta: string };
  /** Semanas del bloque que no existían todavía. */
  semanasCreadas: number;
  /** Turnos agregados en celdas que estaban vacías. */
  celdasNuevas: number;
  /** Turnos que ya había y se dejaron como estaban. */
  celdasRespetadas: number;
  /** Turnos borrados por haber elegido rehacer. */
  celdasReemplazadas: number;
};

export async function generarRangoRequest(data: {
  desde: string;
  hasta: string;
  modo?: ModoGeneracion;
}): Promise<ResultadoGenerarRango> {
  return apiRequest('/semanario/generar-rango', { method: 'POST', body: data });
}

export async function guardarSemanaRequest(data: {
  semanaId: number;
  asignaciones: AsignacionInput[];
}): Promise<{ message: string }> {
  return apiRequest('/semanario/asignaciones', { method: 'PUT', body: data });
}

export async function guardarCeldaRequest(data: {
  semanaId: number;
  fecha: string;
  turno: Turno;
  recepcionistaId: number;
  destacado?: boolean;
  nota?: string;
}): Promise<void> {
  await apiRequest('/semanario/asignaciones/celda', { method: 'PUT', body: data });
}

export async function borrarCeldaRequest(
  semanaId: number,
  fecha: string,
  turno: Turno
): Promise<{ message: string }> {
  const query = new URLSearchParams({ semanaId: String(semanaId), fecha, turno });
  return apiRequest(`/semanario/asignaciones/celda?${query.toString()}`, { method: 'DELETE' });
}

export async function crearRecepcionistaRequest(data: {
  nombre: string;
  notas?: string;
}): Promise<Recepcionista> {
  return apiRequest('/semanario/recepcionistas', { method: 'POST', body: data });
}

export async function actualizarRecepcionistaRequest(
  id: number,
  data: { nombre?: string; orden?: number; activo?: boolean; notas?: string }
): Promise<Recepcionista> {
  return apiRequest(`/semanario/recepcionistas/${id}`, { method: 'PUT', body: data });
}

export async function desactivarRecepcionistaRequest(id: number): Promise<{ message: string }> {
  return apiRequest(`/semanario/recepcionistas/${id}`, { method: 'DELETE' });
}

/** La borra del roster. Sus turnos quedan vacíos, no se reasignan solos. */
export async function eliminarRecepcionistaRequest(id: number): Promise<{
  message: string;
  turnosEliminados: number;
}> {
  return apiRequest(`/semanario/recepcionistas/${id}/eliminar`, { method: 'POST' });
}

/** Guarda el orden de la rotación: la lista completa, ya ordenada. */
export async function reordenarRosterRequest(ids: number[]): Promise<{ message: string }> {
  return apiRequest('/semanario/recepcionistas/orden', { method: 'PUT', body: { ids } });
}

/** Vacía los 14 turnos de la semana pero la deja en el grid. */
export async function vaciarSemanaRequest(semanaId: number): Promise<{ message: string }> {
  return apiRequest(`/semanario/semanas/${semanaId}/asignaciones`, { method: 'DELETE' });
}

/** Elimina la semana del grid. */
export async function eliminarSemanaRequest(semanaId: number): Promise<{ message: string }> {
  return apiRequest(`/semanario/semanas/${semanaId}`, { method: 'DELETE' });
}

/** Vacía todo el horario; el roster de recepcionistas se conserva. */
export async function vaciarSemanarioRequest(): Promise<{
  message: string;
  semanas: number;
  turnos: number;
}> {
  return apiRequest('/semanario', { method: 'DELETE' });
}

/**
 * Vacía los turnos de todas las semanas. Ni las semanas ni las recepcionistas se
 * tocan: el grid queda en blanco para llenarlo de nuevo.
 */
export async function vaciarTurnosRequest(): Promise<{
  message: string;
  turnos: number;
  roster: number;
  semanas: number;
}> {
  return apiRequest('/semanario/turnos', { method: 'DELETE' });
}