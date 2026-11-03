const HOTEL_TIME_ZONE = 'America/Bogota';
export const CHECKOUT_HOUR = 13;
export const CHECKOUT_TOLERANCE_MINUTES = 180;
export const CHECKOUT_OVERTIME_RATE = 10_000;
export const HOTEL_CHECKOUT_TIME = '13:00';

type BogotaDate = { year: number; month: number; day: number };
type ClockTime = { hour: number; minute: number };

/**
 * Lee una hora "HH:mm" (la que se configura en Ajustes) y cae en el valor por
 * defecto si viene vacía o mal formada. El servidor y la interfaz deben usar
 * exactamente la misma hora límite.
 */
export function parseClockTime(value: string | null | undefined, fallback: ClockTime): ClockTime {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value?.trim() ?? '');
  if (!match) return fallback;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (!Number.isInteger(hour) || !Number.isInteger(minute)) return fallback;
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return fallback;
  return { hour, minute };
}

function bogotaClock(value: Date): { date: BogotaDate; minutes: number; seconds: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: HOTEL_TIME_ZONE,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hourCycle: 'h23'
  }).formatToParts(value);
  const part = (type: string): number => Number(parts.find((item) => item.type === type)?.value);
  return {
    date: { year: part('year'), month: part('month'), day: part('day') },
    minutes: part('hour') * 60 + part('minute'),
    seconds: part('second')
  };
}

function dateDifferenceInDays(start: BogotaDate, end: BogotaDate): number {
  const startUtc = Date.UTC(start.year, start.month - 1, start.day);
  const endUtc = Date.UTC(end.year, end.month - 1, end.day);
  return Math.max(0, Math.floor((endUtc - startUtc) / 86_400_000));
}

/**
 * Noches que se cobran a una salida. La tarifa diaria cubre hasta la hora
 * límite de salida (por defecto 13:00). Entre esa hora y la tolerancia
 * (por defecto 3 horas) se mantienen las noches base y el exceso se cobra
 * aparte como excedente opcional. Superada la tolerancia se suma otra noche.
 */
export function calculateBillableNights(
  checkIn: Date,
  at: Date,
  toleranceMinutes = CHECKOUT_TOLERANCE_MINUTES,
  checkoutLimit = HOTEL_CHECKOUT_TIME
): number {
  const entry = bogotaClock(checkIn);
  const current = bogotaClock(at);
  const daysSinceEntry = dateDifferenceInDays(entry.date, current.date);

  // Todo huésped que ingresa cuenta automáticamente con al menos 1 noche.
  if (daysSinceEntry === 0) return 1;

  const limit = parseClockTime(checkoutLimit, { hour: CHECKOUT_HOUR, minute: 0 });
  const limitMinutes = limit.hour * 60 + limit.minute;
  const minutesToday = current.minutes + current.seconds / 60;
  const baseNights = daysSinceEntry;

  // Hasta la hora límite se liquidan solo las noches base.
  if (minutesToday <= limitMinutes) return baseNights;

  // Dentro de la tolerancia se mantienen las noches base; el exceso se cobra
  // como excedente (opcional, solo cuando el hotel está lleno).
  if (minutesToday <= limitMinutes + Math.max(0, toleranceMinutes)) return baseNights;

  // Superada la tolerancia ya cuenta como otra noche completa.
  return baseNights + 1;
}

export function calculateStayCharge(
  checkIn: Date,
  at: Date,
  nightlyRate: number,
  toleranceMinutes = CHECKOUT_TOLERANCE_MINUTES,
  overtimeRate = CHECKOUT_OVERTIME_RATE,
  checkoutLimit = HOTEL_CHECKOUT_TIME
) {
  const rate = Number.isFinite(nightlyRate) ? nightlyRate : 0;
  const hourRate = Number.isFinite(overtimeRate) ? overtimeRate : 0;
  const tolerance = Math.max(0, Number.isFinite(toleranceMinutes) ? toleranceMinutes : CHECKOUT_TOLERANCE_MINUTES);
  const nights = calculateBillableNights(checkIn, at, tolerance, checkoutLimit);

  const entry = bogotaClock(checkIn);
  const current = bogotaClock(at);
  const daysSinceEntry = dateDifferenceInDays(entry.date, current.date);

  const limit = parseClockTime(checkoutLimit, { hour: CHECKOUT_HOUR, minute: 0 });
  const limitMinutes = limit.hour * 60 + limit.minute;
  const minutesToday = current.minutes + current.seconds / 60;

  // El excedente por horas solo aplica a partir de la segunda noche (después
  // de la primera) y dentro de la ventana de tolerancia.
  const isOvertimeWindow =
    daysSinceEntry > 0 &&
    minutesToday > limitMinutes &&
    minutesToday <= limitMinutes + tolerance;

  const overtimeMinutes = isOvertimeWindow ? minutesToday - limitMinutes : 0;
  const overtimeHours = Math.ceil(overtimeMinutes / 60);
  const overtimeAmount = overtimeHours * hourRate;

  return {
    nights,
    overtimeHours,
    overtimeAmount,
    total: nights * rate + overtimeAmount
  };
}
