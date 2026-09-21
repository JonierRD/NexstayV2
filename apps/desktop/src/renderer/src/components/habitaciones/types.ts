import { type Habitacion } from '../../lib/api';
import { formatCOP } from '../../lib/format';

export type RoomStatus = 'DISPONIBLE' | 'OCUPADA' | 'RESERVADA' | 'MANTENIMIENTO';
export type RoomType = 'DOSCAMAS' | 'MATRIMONIAL' | 'SENCILLA';

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
  checkOut?: string;
  nights?: number;
  selectedAc?: string;
  priceDisplay: string;
  priceWithAir: number;
  priceWithFan: number;
  storeDebt: number;
  heroTone: string;     // gradientes visuales
  accentTone: string;
  stayId?: number; // ID del hospedaje actual para editar
  hasAir: boolean;
  hasFan: boolean;
};

export const heroTones = [
  'from-[#8f654c] via-[#caa27f] to-[#f4e5d5]',
  'from-[#9e8a74] via-[#d6c2aa] to-[#f8efe4]',
  'from-[#937252] via-[#ccb090] to-[#f4eadf]',
  'from-[#9f8163] via-[#dcc5aa] to-[#f7efe5]',
  'from-[#84614a] via-[#c8a27d] to-[#f0e1d0]',
  'from-[#8f7764] via-[#d7c2a9] to-[#f8f1e8]',
  'from-[#927255] via-[#d7b794] to-[#f6ebe0]',
  'from-[#8a6e58] via-[#d2baa1] to-[#f8f0e7]',
  'from-[#9a7a5c] via-[#d9c4ad] to-[#f7efe4]',
  'from-[#91765f] via-[#d3bda5] to-[#f7efe6]',
  'from-[#9a816d] via-[#e0cdb6] to-[#f8f2ea]',
  'from-[#8e7159] via-[#d6bfa6] to-[#f8f0e7]',
  'from-[#95755e] via-[#d6c1aa] to-[#f8f0e8]',
  'from-[#90705a] via-[#d2bca6] to-[#f8efe6]',
  'from-[#8c6f58] via-[#d0baa2] to-[#f6eee4]',
  'from-[#9a7c63] via-[#dcc8b2] to-[#f8efe6]',
  'from-[#8a6f58] via-[#d4c0a9] to-[#f7efe7]'
];

export const accentTones = [
  'from-[#7a4a34] to-[#b97455]',
  'from-[#9b7250] to-[#d7b18d]',
  'from-[#7d4f31] to-[#b6805c]',
  'from-[#926645] to-[#c89d75]',
  'from-[#74462d] to-[#ad7854]',
  'from-[#7d5439] to-[#c39970]',
  'from-[#7e563c] to-[#c39573]',
  'from-[#73472f] to-[#b37e58]',
  'from-[#88583b] to-[#c29570]',
  'from-[#7a4e35] to-[#b98260]',
  'from-[#7d4f32] to-[#b58359]',
  'from-[#825237] to-[#c28f6c]',
  'from-[#7b4d34] to-[#be8e67]',
  'from-[#7a4b31] to-[#b58462]',
  'from-[#73482f] to-[#ad7e5a]',
  'from-[#84553a] to-[#c0946c]',
  'from-[#73472d] to-[#b8845d]'
];

export const statusStyles: Record<RoomStatus, string> = {
  DISPONIBLE: 'bg-success-50 text-success border-success-100',
  OCUPADA: 'bg-danger-50 text-danger border-danger-150',
  RESERVADA: 'bg-[#fff5df] text-gold border-[#f2dbab]',
  MANTENIMIENTO: 'bg-[#f5efe9] text-[#8f5e3d] border-[#dcc5b1]'
};

// Convierte una habitación de la API (Habitacion) a la estructura local Room
export function mapApiRoom(apiRoom: Habitacion, index: number): Room {
  const typeLabel: Record<string, string> = {
    DOSCAMAS: 'Dos Camas',
    MATRIMONIAL: 'Matrimonial',
    SENCILLA: 'Sencilla'
  };
  const fmtPrice = (v: number | null) => v !== null ? formatCOP(v) : null;
  const priceFanDsp = fmtPrice(apiRoom.priceWithFan);
  const priceAirDsp = fmtPrice(apiRoom.priceWithAir);
  const priceFanNum = apiRoom.priceWithFan ?? 0;
  const priceAirNum = apiRoom.priceWithAir ?? 0;
  const acLabel = apiRoom.hasAir && apiRoom.hasFan ? 'Aire / Ventilador' : apiRoom.hasAir ? 'Aire acondicionado' : apiRoom.hasFan ? 'Ventilador' : '---';
  return {
    number: apiRoom.number,
    type: apiRoom.type,
    status: apiRoom.status,
    image: apiRoom.image,
    acType: acLabel,
    description: `Habitación ${typeLabel[apiRoom.type]}`,
    selectedAc: apiRoom.hasAir ? 'Aire' : apiRoom.hasFan ? 'Ventilador' : '---',
    priceDisplay: priceAirDsp && priceFanDsp ? `${priceAirDsp} / ${priceFanDsp}` : (priceAirDsp || priceFanDsp || '---'),
    priceWithAir: priceAirNum,
    priceWithFan: priceFanNum,
    storeDebt: 0,
    heroTone: heroTones[index % heroTones.length],
    accentTone: accentTones[index % accentTones.length],
    hasAir: apiRoom.hasAir,
    hasFan: apiRoom.hasFan
  };
}