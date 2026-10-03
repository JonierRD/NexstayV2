import sencillaImg from '../assets/habitaciones/sencilla.png';
import matrimonialImg from '../assets/habitaciones/matrimonial.png';
import dobleImg from '../assets/habitaciones/doblecama.jpeg';

export type RoomTypeKey = 'DOSCAMAS' | 'MATRIMONIAL' | 'SENCILLA';

export const roomImages: Record<RoomTypeKey, string> = {
  DOSCAMAS: dobleImg,
  MATRIMONIAL: matrimonialImg,
  SENCILLA: sencillaImg
};

export const roomImageFallback = sencillaImg;

export function roomImage(type?: string | null): string {
  // La clave llega como string desde la API; si no es un tipo conocido cae al fallback.
  const image = type ? roomImages[type as RoomTypeKey] : undefined;
  return image || roomImageFallback;
}