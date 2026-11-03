export const HOTEL_TIME_ZONE = 'America/Bogota';

/**
 * Fecha calendario (AAAA-MM-DD) en la zona horaria del hotel. El servidor
 * puede estar en UTC, por lo que nunca se debe usar `toISOString()` para
 * decidir "hoy" en las reglas del negocio.
 */
export function bogotaDateOnly(value: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: HOTEL_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(value);
  return `${parts.find((part) => part.type === 'year')?.value}-${parts.find((part) => part.type === 'month')?.value}-${parts.find((part) => part.type === 'day')?.value}`;
}

export function todayDateOnly(): string {
  return bogotaDateOnly(new Date());
}

export function addDays(dateOnlyValue: string, days: number): string {
  const date = new Date(`${dateOnlyValue}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** Convierte una fecha AAAA-MM-DD a la medianoche UTC que usa Prisma. */
export function dateOnlyToUtc(dateOnlyValue: string): Date {
  return new Date(`${dateOnlyValue}T00:00:00.000Z`);
}
