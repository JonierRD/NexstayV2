import { type Habitacion } from '../../lib/api';
import { formatCOP } from '../../lib/format';

export type RoomStatus = 'DISPONIBLE' | 'OCUPADA' | 'RESERVADA' | 'MANTENIMIENTO';
export type RoomType = 'DOSCAMAS' | 'MATRIMONIAL' | 'SENCILLA';

// Coincide con el enum AcType de Prisma. Se usa el valor del enum en toda la app
// y la etiqueta legible ("Aire"/"Ventilador") solo al pintar.
export type AcType = 'AIRE' | 'VENTILADOR';

export const AC_LABEL: Record<AcType, string> = {
  AIRE: 'Aire',
  VENTILADOR: 'Ventilador'
};

// Estructura de habitación para la UI (mezcla datos de Room API + Stay activo)
export type Room = {
  number: string;
  type: RoomType;
  status: RoomStatus;
  acType: string;
  description: string;
  image: string | null;
  guest?: string;       // huésped actual (del stay activo)
  checkIn?: string;
  checkOut?: string | null;
  nights?: number;
  selectedAc?: AcType | null;
  priceDisplay: string;
  priceWithAir: number;
  priceWithFan: number;
  storeDebt: number;
  laundryDebt?: number;
  heroTone: string;     // gradientes visuales
  accentTone: string;
  stayId?: number; // ID del hospedaje actual para editar
  hasAir: boolean;
  hasFan: boolean;
};

// Re-exportación para retrocompatibilidad desde ./mappers
export { heroTones, accentTones, statusStyles, mapApiRoom } from './mappers';