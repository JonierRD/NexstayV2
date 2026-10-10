import { useEffect, useState } from 'react';
import { getSettingsRequest, type AppSettings } from './api/settings';

/**
 * Cache compartida de la configuracion del hotel. Varias partes de la app usan
 * las settings (logo en el menu, horas de check-in/check-out, etc.) sin pedir
 * cada una su copia. Cuando desde Configuracion se guarda un cambio, se invalida
 * via invalidateSettings() y todos los consumidores se refrescan.
 */
let cache: AppSettings | null = null;
let pending: Promise<AppSettings> | null = null;

export const SETTINGS_CHANGED_EVENT = 'sapay:settings-changed';

export function getSettingsCached(): Promise<AppSettings> {
  if (cache) {
    return Promise.resolve(cache);
  }
  if (!pending) {
    pending = getSettingsRequest()
      .then((settings) => {
        cache = settings;
        return settings;
      })
      .finally(() => {
        pending = null;
      });
  }
  return pending;
}

export function invalidateSettings(): void {
  cache = null;
  window.dispatchEvent(new CustomEvent(SETTINGS_CHANGED_EVENT));
}

export function setSettingsCache(settings: AppSettings): void {
  cache = settings;
}

export function useSettingsCached(): AppSettings | null {
  const [settings, setSettings] = useState<AppSettings | null>(cache);

  useEffect(() => {
    let active = true;
    const refresh = (): void => {
      getSettingsCached()
        .then((next) => {
          if (active) setSettings(next);
        })
        .catch(() => undefined);
    };
    refresh();
    window.addEventListener(SETTINGS_CHANGED_EVENT, refresh);
    return () => {
      active = false;
      window.removeEventListener(SETTINGS_CHANGED_EVENT, refresh);
    };
  }, []);

  return settings;
}

export type HotelBrand = {
  hotelName: string;
  logoDataUrl: string;
};

export function useHotelBrand(): HotelBrand | null {
  const settings = useSettingsCached();
  if (!settings) {
    return null;
  }
  return { hotelName: settings.hotelName, logoDataUrl: settings.logoDataUrl };
}