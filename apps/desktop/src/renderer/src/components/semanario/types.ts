import type { CeldaSemanario, SemanaSemanario, Turno } from '../../lib/api';

export type { CeldaSemanario, SemanaSemanario, Turno };

/** Columnas fijas del grid: la semana siempre va de domingo a sábado. */
export const DIAS_SEMANA = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado'
] as const;

export const MESES_CORTOS = [
  'ENE',
  'FEB',
  'MAR',
  'ABR',
  'MAY',
  'JUN',
  'JUL',
  'AGO',
  'SEP',
  'OCT',
  'NOV',
  'DIC'
];

export const TURNO_LABELS: Record<Turno, string> = {
  DIA: 'Día',
  NOCHE: 'Noche'
};

/** Horarios fijos del hotel. Viven en el enum del backend, no en la base de datos. */
export const TURNO_HORAS: Record<Turno, string> = {
  DIA: '07:00 - 19:00',
  NOCHE: '19:00 - 07:00'
};

function partes(iso: string): { dia: number; mes: number; anio: number } {
  const [anio, mes, dia] = iso.split('-').map(Number);
  return { dia, mes, anio };
}

/** "7 - 13 JUN", y "31 MAY - 6 JUN" cuando la semana cruza de mes. */
export function etiquetaSemana(inicioIso: string, finIso: string): string {
  const inicio = partes(inicioIso);
  const fin = partes(finIso);

  if (inicio.mes === fin.mes && inicio.anio === fin.anio) {
    return `${inicio.dia} - ${fin.dia} ${MESES_CORTOS[inicio.mes - 1]}`;
  }
  if (inicio.anio !== fin.anio) {
    return `${inicio.dia} ${MESES_CORTOS[inicio.mes - 1]} ${inicio.anio} - ${fin.dia} ${MESES_CORTOS[fin.mes - 1]} ${fin.anio}`;
  }
  return `${inicio.dia} ${MESES_CORTOS[inicio.mes - 1]} - ${fin.dia} ${MESES_CORTOS[fin.mes - 1]}`;
}

export function etiquetaFechaCorta(iso: string): string {
  const { dia, mes } = partes(iso);
  return `${dia} ${MESES_CORTOS[mes - 1]}`;
}

/**
 * Rango completo del semanario, para el encabezado.
 */
export function etiquetaRango(desde: string, hasta: string): string {
  return `${etiquetaFechaCorta(desde)} → ${etiquetaFechaCorta(hasta)}`;
}

/**
 * Rango que se muestra en la fila de una semana.
 *
 * El bloque siempre es domingo-sábado porque las columnas del grid lo son, pero
 * el rótulo tiene que decir los días que realmente se agendaron. Si el rango
 * pedido empieza el lunes 05/10, la primera fila se rotula "5 - 10" y no
 * "4 - 10": el domingo 04/10 existe como columna vacía, no como día de horario.
 */
export function etiquetaFila(
  semana: { fechaInicio: string; fechaFin: string },
  rango: { desde: string; hasta: string } | null
): string {
  if (!rango) {
    return etiquetaSemana(semana.fechaInicio, semana.fechaFin);
  }
  const inicio = semana.fechaInicio < rango.desde ? rango.desde : semana.fechaInicio;
  const fin = semana.fechaFin > rango.hasta ? rango.hasta : semana.fechaFin;
  return etiquetaSemana(inicio, fin);
}

/** Hoy en horario local, en el mismo formato YYYY-MM-DD que usa la API. */
export function hoyIso(): string {
  const ahora = new Date();
  const mes = String(ahora.getMonth() + 1).padStart(2, '0');
  const dia = String(ahora.getDate()).padStart(2, '0');
  return `${ahora.getFullYear()}-${mes}-${dia}`;
}

export function claveCelda(fecha: string, turno: Turno): string {
  return `${fecha}|${turno}`;
}

/**
 * Un mapa por semana con las celdas indexadas por `fecha|turno`. El backend
 * siempre manda las 14, pero indexar evita buscar con `find` por cada celda
 * que se pinta.
 */
export function indexarCeldas(semana: SemanaSemanario): Map<string, CeldaSemanario> {
  return new Map(semana.celdas.map((celda) => [claveCelda(celda.fecha, celda.turno), celda]));
}

/** Nombre corto para la cabecera: "SOFIA" en vez de "SOFÍA HERNÁNDEZ". */
export function nombreCorto(nombre: string): string {
  const palabras = nombre.trim().split(/\s+/);
  if (palabras.length <= 2) {
    return nombre.toUpperCase();
  }
  return palabras
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
    .join(' ');
}