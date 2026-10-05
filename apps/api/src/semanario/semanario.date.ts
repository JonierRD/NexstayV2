import { BadRequestException } from '@nestjs/common';

export const DIAS_POR_SEMANA = 7;
const MS_POR_DIA = 86_400_000;

/**
 * Utilidades de fecha del semanario.
 *
 * Las columnas `fecha_inicio` y `fecha` son `@db.Date`: no admiten hora. Todo lo
 * que se compare o se sume aqui se normaliza a medianoche UTC, porque mezclar una
 * fecha a medianoche local con otra a medianoche UTC produce desplazamientos de un
 * día justo en las sumas de fechas, que es donde el error se vuelve invisible.
 */

/** Normaliza cualquier entrada (Date o "YYYY-MM-DD") a medianoche UTC. */
export function dateOnly(value: Date | string): Date {
  if (typeof value === 'string') {
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
    if (!match) {
      throw new BadRequestException(`Fecha inválida: "${value}". Se espera el formato AAAA-MM-DD.`);
    }
    return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  }

  if (Number.isNaN(value.getTime())) {
    throw new BadRequestException('Fecha inválida.');
  }

  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * MS_POR_DIA);
}

/** Días completos entre dos fechas, sin importar la hora. Positivo si `to` es posterior. */
export function diffDays(from: Date, to: Date): number {
  return Math.round((dateOnly(to).getTime() - dateOnly(from).getTime()) / MS_POR_DIA);
}

/**
 * Domingo de la semana a la que pertenece la fecha (`getUTCDay` ya da 0 para
 * domingo). Es la regla que sostiene las columnas del grid: si el rango empieza
 * un miércoles, se retrocede a su domingo y la semana sale siempre domingo-sábado.
 */
export function startOfWeek(date: Date): Date {
  const base = dateOnly(date);
  return addDays(base, -base.getUTCDay());
}

export function endOfWeek(start: Date): Date {
  return addDays(start, DIAS_POR_SEMANA - 1);
}

/** Número de semana ISO-8601: la semana 1 es la que contiene el primer jueves del año. */
export function isoWeekNumber(date: Date): number {
  const d = dateOnly(date);
  const isoDay = d.getUTCDay() || 7; // lunes = 1 ... domingo = 7
  d.setUTCDate(d.getUTCDate() + 4 - isoDay); // jueves de la semana actual
  const yearStart = Date.UTC(d.getUTCFullYear(), 0, 1);
  return Math.ceil(((d.getTime() - yearStart) / MS_POR_DIA + 1) / 7);
}

/** Serializa a "YYYY-MM-DD", que es el formato con el que viaja hacia el frontend. */
export function toIsoDate(date: Date): string {
  const base = dateOnly(date);
  const year = String(base.getUTCFullYear()).padStart(4, '0');
  const month = String(base.getUTCMonth() + 1).padStart(2, '0');
  const day = String(base.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Rango cerrado de semanas domingo-sábado que cubre el periodo pedido.
 * El inicio retrocede al domingo de su semana y el final avanza al sábado de la
 * última, para que ninguna semana quede partida en dos filas del grid.
 *
 * Ojo: esto define las SEMANAS que existen, no los DÍAS que se asignan. Si el
 * administrador pide del 05/10 al 18/11, se crean las 7 semanas del bloque pero
 * solo se asignan los días que caen dentro del rango; el resto queda vacío y el
 * administrador lo completa a mano si quiere.
 */
export function rangoDeSemanas(desde: Date, hasta: Date): { inicio: Date; fin: Date } {
  const inicio = startOfWeek(desde);
  const fin = endOfWeek(startOfWeek(hasta));
  return { inicio, fin };
}