import { type AppSettings } from '@prisma/client';

/**
 * Forma en que la configuracion se expone hacia el cliente. `themeColor` y
 * `darkMode` llegan publicos para que la app pueda aplicar el tema incluso
 * antes del login (pantalla de ingreso).
 */
export type AppSettingsData = {
  hotelName: string;
  hotelNit: string;
  hotelAddress: string;
  hotelPhone: string;
  hotelEmail: string;
  logoDataUrl: string;
  themeColor: string;
  darkMode: boolean;
  checkoutLimit: string;
  checkoutTolerance: number;
  cancellationPolicy: string;
  aiEnabled: boolean;
};

export function toSettingsData(settings: AppSettings): AppSettingsData {
  return {
    hotelName: settings.hotelName,
    hotelNit: settings.hotelNit,
    hotelAddress: settings.hotelAddress,
    hotelPhone: settings.hotelPhone,
    hotelEmail: settings.hotelEmail,
    logoDataUrl: settings.logoDataUrl,
    themeColor: settings.themeColor,
    darkMode: settings.darkMode,
    checkoutLimit: settings.checkoutLimit,
    checkoutTolerance: settings.checkoutTolerance,
    cancellationPolicy: settings.cancellationPolicy,
    aiEnabled: settings.aiEnabled
  };
}