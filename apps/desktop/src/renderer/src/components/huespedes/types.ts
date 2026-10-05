import { formatElapsed } from '../../lib/format';

// Re-exportación para retrocompatibilidad desde la fuente única de verdad
export const elapsed = formatElapsed;

export type GuestStaySummary = {
  id: number;
  roomNumber: string;
  guestName: string;
  cc: string;
  checkIn: string;
  checkOut?: string | null;
  nights?: number;
  total?: number;
};