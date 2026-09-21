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