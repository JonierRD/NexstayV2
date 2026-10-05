export function formatCOP(value: number): string {
  return `$${Math.round(value).toLocaleString('es-CO')}`;
}

export function formatDate(value: string | Date): string {
  return new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium' }).format(new Date(value));
}

export function formatDateShort(value: string | Date): string {
  return new Date(value).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

export function formatDateRange(checkIn: string, checkOut?: string | null): string {
  const entrada = formatDate(checkIn);
  const salida = checkOut ? formatDate(checkOut) : 'En curso';
  return `${entrada} → ${salida}`;
}

export function formatDateTime(value: string | Date): string {
  return new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(value)
  );
}

const HEADER_DATE_FORMAT = new Intl.DateTimeFormat('es-CO', {
  day: 'numeric',
  month: 'long',
  year: 'numeric'
});

const CLOCK_FORMAT = new Intl.DateTimeFormat('es-CO', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: true
});

export function formatHeaderDate(value: string | Date): string {
  return HEADER_DATE_FORMAT.format(new Date(value));
}

export function formatClock(value: string | Date): string {
  return CLOCK_FORMAT.format(new Date(value));
}

const NUMERIC_DATE_TIME_FORMAT = new Intl.DateTimeFormat('es-CO', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: true
});

export const currencyFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0
});

export function formatElapsed(checkIn: string): string {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(checkIn).getTime()) / 60000));
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const remaining = minutes % 60;
  return `${days ? `${days}d ` : ''}${hours}h ${remaining}m`;
}

export function formatDateTimeNumeric(value: string | Date): string {
  return NUMERIC_DATE_TIME_FORMAT.format(new Date(value));
}