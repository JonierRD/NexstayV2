import { useCallback, useEffect, useState } from 'react';
import {
  ApiError,
  getSettingsRequest,
  updateSettingsRequest,
  type AppSettings,
  type ThemeColor
} from '../../lib/api';
import { applyTheme } from '../../lib/theme';
import { invalidateSettings, setSettingsCache } from '../../lib/settingsCache';

export type SectionKey = 'hotel' | 'apariencia' | 'politicas' | 'ia';
export type ConfigStatus = { kind: 'success' | 'error'; message: string } | null;

const EMPTY_FIELDS = {
  hotelName: '',
  hotelNit: '',
  hotelAddress: '',
  hotelPhone: '',
  hotelEmail: ''
};

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [hotel, setHotel] = useState<typeof EMPTY_FIELDS & { logoDataUrl: string }>({
    ...EMPTY_FIELDS,
    logoDataUrl: ''
  });
  const [checkinLimit, setCheckinLimit] = useState('12:00');
  const [checkoutLimit, setCheckoutLimit] = useState('13:00');
  const [checkoutTolerance, setCheckoutTolerance] = useState(30);
  const [cancellationPolicy, setCancellationPolicy] = useState('');
  const [aiEnabled, setAiEnabled] = useState(true);

  const [saving, setSaving] = useState<SectionKey | null>(null);
  const [status, setStatus] = useState<ConfigStatus>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await getSettingsRequest();
      setSettings(data);
      setHotel({
        hotelName: data.hotelName,
        hotelNit: data.hotelNit,
        hotelAddress: data.hotelAddress,
        hotelPhone: data.hotelPhone,
        hotelEmail: data.hotelEmail,
        logoDataUrl: data.logoDataUrl
      });
      setCheckinLimit(data.checkinLimit);
      setCheckoutLimit(data.checkoutLimit);
      setCheckoutTolerance(data.checkoutTolerance);
      setCancellationPolicy(data.cancellationPolicy);
      setAiEnabled(data.aiEnabled);
      applyTheme({ themeColor: data.themeColor, darkMode: data.darkMode });
    } catch (error) {
      setLoadError(error instanceof ApiError ? error.message : 'No se pudo conectar con la API.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function persist(section: SectionKey, input: Partial<AppSettings>): Promise<boolean> {
    setSaving(section);
    setStatus(null);
    try {
      const updated = await updateSettingsRequest(input);
      setSettings(updated);
      setSettingsCache(updated);
      invalidateSettings();
      applyTheme({ themeColor: updated.themeColor, darkMode: updated.darkMode });
      setStatus({ kind: 'success', message: 'Cambios guardados correctamente.' });
      return true;
    } catch (error) {
      setStatus({
        kind: 'error',
        message: error instanceof ApiError ? error.message : 'No se pudo conectar con la API.'
      });
      return false;
    } finally {
      setSaving(null);
    }
  }

  async function saveHotel(): Promise<boolean> {
    return persist('hotel', {
      hotelName: hotel.hotelName.trim(),
      hotelNit: hotel.hotelNit.trim(),
      hotelAddress: hotel.hotelAddress.trim(),
      hotelPhone: hotel.hotelPhone.trim(),
      hotelEmail: hotel.hotelEmail.trim(),
      logoDataUrl: hotel.logoDataUrl
    });
  }

  async function saveAppearance(input: { themeColor?: ThemeColor; darkMode?: boolean }): Promise<boolean> {
    // Reverso optimista: se muestra al instante y se revierte si la API falla.
    const previous = settings;
    applyTheme({
      themeColor: input.themeColor ?? previous?.themeColor ?? 'cafe',
      darkMode: input.darkMode ?? previous?.darkMode ?? false
    });
    const ok = await persist('apariencia', input);
    if (!ok && previous) {
      applyTheme({ themeColor: previous.themeColor, darkMode: previous.darkMode });
    }
    return ok;
  }

  async function savePolicies(): Promise<boolean> {
    return persist('politicas', {
      checkinLimit: checkinLimit.trim() || '12:00',
      checkoutLimit: checkoutLimit.trim() || '13:00',
      checkoutTolerance,
      cancellationPolicy: cancellationPolicy.trim()
    });
  }

  async function saveAi(enabled: boolean): Promise<boolean> {
    setAiEnabled(enabled);
    const ok = await persist('ia', { aiEnabled: enabled });
    if (!ok && settings) {
      setAiEnabled(settings.aiEnabled);
    }
    return ok;
  }

  function clearStatus(): void {
    setStatus(null);
  }

  return {
    settings,
    loading,
    loadError,
    hotel,
    setHotel,
    checkinLimit,
    setCheckinLimit,
    checkoutLimit,
    setCheckoutLimit,
    checkoutTolerance,
    setCheckoutTolerance,
    cancellationPolicy,
    setCancellationPolicy,
    aiEnabled,
    saving,
    status,
    setStatus,
    clearStatus,
    saveHotel,
    saveAppearance,
    savePolicies,
    saveAi
  };
}