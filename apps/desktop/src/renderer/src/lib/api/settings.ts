import { apiRequest } from './client';

export type ThemeColor = 'cafe' | 'verde' | 'azul';

export type AppSettings = {
  hotelName: string;
  hotelNit: string;
  hotelAddress: string;
  hotelPhone: string;
  hotelEmail: string;
  logoDataUrl: string;
  themeColor: ThemeColor;
  darkMode: boolean;
  checkinLimit: string;
  checkoutLimit: string;
  checkoutTolerance: number;
  cancellationPolicy: string;
  aiEnabled: boolean;
};

export async function getSettingsRequest(): Promise<AppSettings> {
  return apiRequest<AppSettings>('/settings', { method: 'GET', auth: false });
}

export async function updateSettingsRequest(input: Partial<AppSettings>): Promise<AppSettings> {
  return apiRequest<AppSettings>('/settings', { method: 'PUT', body: input });
}