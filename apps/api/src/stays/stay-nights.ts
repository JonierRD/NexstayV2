const HOTEL_TIME_ZONE = 'America/Bogota';
const CHECKOUT_HOUR = 13;

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

export function calculateBillableNights(checkIn: Date, at: Date): number {
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

  return Math.max(1, 1 + daysSinceEntry - (currentHour * 3600 + currentMinute * 60 + currentSecond <= CHECKOUT_HOUR * 3600 ? 1 : 0));
}

export const HOTEL_CHECKOUT_TIME = '13:00';
