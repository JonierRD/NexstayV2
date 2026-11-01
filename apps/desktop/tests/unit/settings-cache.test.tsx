import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeSettings } from '../helpers/fixtures';

const getSettingsRequest = vi.fn();
vi.mock('@/lib/api/settings', () => ({ getSettingsRequest }));

describe('U6 - lib/settingsCache.ts', () => {
  beforeEach(() => {
    getSettingsRequest.mockReset();
  });

  async function loadCacheModule() {
    vi.resetModules();
    return import('@/lib/settingsCache');
  }

  it('getSettingsCached llama a la API solo la primera vez', async () => {
    const settings = makeSettings();
    getSettingsRequest.mockResolvedValue(settings);
    const { getSettingsCached } = await loadCacheModule();

    await getSettingsCached();
    await getSettingsCached();

    expect(getSettingsRequest).toHaveBeenCalledTimes(1);
  });

  it('getSettingsCached comparte la misma promesa si se llama en paralelo', async () => {
    let resolveRequest!: (value: ReturnType<typeof makeSettings>) => void;
    const request = new Promise<ReturnType<typeof makeSettings>>((resolve) => {
      resolveRequest = resolve;
    });
    getSettingsRequest.mockReturnValue(request);
    const { getSettingsCached } = await loadCacheModule();

    const first = getSettingsCached();
    const second = getSettingsCached();

    expect(first).toBe(second);
    resolveRequest(makeSettings());
    await first;
    expect(getSettingsRequest).toHaveBeenCalledTimes(1);
  });

  it('setSettingsCache evita la llamada a la API', async () => {
    const settings = makeSettings();
    getSettingsRequest.mockResolvedValue(settings);
    const { getSettingsCached, setSettingsCache } = await loadCacheModule();

    setSettingsCache(settings);

    await expect(getSettingsCached()).resolves.toEqual(settings);
    expect(getSettingsRequest).not.toHaveBeenCalled();
  });

  it('invalidateSettings limpia la cache y emite SETTINGS_CHANGED_EVENT', async () => {
    const settings = makeSettings();
    getSettingsRequest.mockResolvedValue(settings);
    const { getSettingsCached, invalidateSettings, SETTINGS_CHANGED_EVENT } =
      await loadCacheModule();
    const dispatch = vi.spyOn(window, 'dispatchEvent');

    await getSettingsCached();
    invalidateSettings();
    await getSettingsCached();

    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: SETTINGS_CHANGED_EVENT })
    );
    expect(getSettingsRequest).toHaveBeenCalledTimes(2);
  });

  it('useHotelBrand devuelve null sin settings y el nombre/logo cuando existen', async () => {
    getSettingsRequest.mockResolvedValue(makeSettings());
    const { useHotelBrand, setSettingsCache } = await loadCacheModule();
    const empty = renderHook(() => useHotelBrand());

    expect(empty.result.current).toBeNull();

    empty.unmount();
    setSettingsCache(makeSettings({ hotelName: 'Hotel Prueba', logoDataUrl: 'logo' }));
    const loaded = renderHook(() => useHotelBrand());

    await waitFor(() => {
      expect(loaded.result.current).toEqual({
        hotelName: 'Hotel Prueba',
        logoDataUrl: 'logo'
      });
    });
  });
});
