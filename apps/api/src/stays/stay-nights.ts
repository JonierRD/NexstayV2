const HOTEL_TIME_ZONE = 'America/Bogota';
const CHECKOUT_HOUR = 13;
const CHECKOUT_TOLERANCE_MINUTES = 180;
export const CHECKOUT_OVERTIME_RATE = 10_000;

type BogotaDate = { year: number; month: number; day: number };

function bogotaDate(value: Date): BogotaDate {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: HOTEL_TIME_ZONE,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric'
  }).formatToParts(value);
  return {
    year: Number(parts.find((part) => part.type === 'year')?.value),
    month: Number(parts.find((part) => part.type === 'month')?.value),
    day: Number(parts.find((part) => part.type === 'day')?.value)
  };
}

function dateDifferenceInDays(start: BogotaDate, end: BogotaDate): number {
  const startUtc = Date.UTC(start.year, start.month - 1, start.day);
  const endUtc = Date.UTC(end.year, end.month - 1, end.day);
  return Math.max(0, Math.floor((endUtc - startUtc) / 86_400_000));
}

export function calculateBillableNights(checkIn: Date, at: Date, toleranceMinutes = CHECKOUT_TOLERANCE_MINUTES): number {
  const entryDate = bogotaDate(checkIn);
  const currentDate = bogotaDate(at);
  const daysSinceEntry = dateDifferenceInDays(entryDate, currentDate);
  const timeParts = new Intl.DateTimeFormat('en-US', {
    timeZone: HOTEL_TIME_ZONE,
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false
  }).formatToParts(at);
  const currentHour = Number(timeParts.find((part) => part.type === 'hour')?.value);
  const currentMinute = Number(timeParts.find((part) => part.type === 'minute')?.value);
  const currentSecond = Number(timeParts.find((part) => part.type === 'second')?.value);

  const minutesToday = currentHour * 60 + currentMinute + currentSecond / 60;
  const baseNights = Math.max(1, daysSinceEntry);
  if (daysSinceEntry === 0 || minutesToday <= CHECKOUT_HOUR * 60) return baseNights;
  if (minutesToday <= CHECKOUT_HOUR * 60 + toleranceMinutes) return baseNights;
  return baseNights + 1;
}

export function calculateStayCharge(checkIn: Date, at: Date, nightlyRate: number, toleranceMinutes = CHECKOUT_TOLERANCE_MINUTES, overtimeRate = CHECKOUT_OVERTIME_RATE) {
  const nights = calculateBillableNights(checkIn, at, toleranceMinutes);
  const entryDate = bogotaDate(checkIn);
  const currentDate = bogotaDate(at);
  const daysSinceEntry = dateDifferenceInDays(entryDate, currentDate);
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: HOTEL_TIME_ZONE, hour: 'numeric', minute: 'numeric', hour12: false
  }).formatToParts(at);
  const hour = Number(parts.find((part) => part.type === 'hour')?.value);
  const minute = Number(parts.find((part) => part.type === 'minute')?.value);
  const minutesToday = hour * 60 + minute;
  const overtimeMinutes = daysSinceEntry > 0 && minutesToday > CHECKOUT_HOUR * 60 &&
    minutesToday <= CHECKOUT_HOUR * 60 + toleranceMinutes
    ? minutesToday - CHECKOUT_HOUR * 60
    : 0;
  const overtimeHours = Math.ceil(overtimeMinutes / 60);
  const overtimeAmount = overtimeHours * overtimeRate;
  return { nights, overtimeHours, overtimeAmount, total: nights * nightlyRate + overtimeAmount };
}

export const HOTEL_CHECKOUT_TIME = '13:00';
