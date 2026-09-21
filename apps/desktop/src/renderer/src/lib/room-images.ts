import sencillaImg from '../assets/habitaciones/sencilla.png';
import matrimonialImg from '../assets/habitaciones/matrimonial.png';
import dobleImg from '../assets/habitaciones/doblecama.jpeg';

export type RoomTypeKey = 'DOSCAMAS' | 'MATRIMONIAL' | 'SENCILLA';

export const roomImages: Record<string, string> = {
  DOSCAMAS: dobleImg,
  MATRIMONIAL: matrimonialImg,
  SENCILLA: sencillaImg
};

export const roomImageFallback = sencillaImg;

export function roomImage(type?: string | null): string {
  return (type && roomImages[type]) || roomImageFallback;
}