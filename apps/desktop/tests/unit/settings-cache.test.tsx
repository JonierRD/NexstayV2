import { describe, it } from 'vitest';

// Responsable: Harold
// Objetivo: cache compartida de configuracion y hook useHotelBrand.
//   import { getSettingsCached, invalidateSettings, setSettingsCache, SETTINGS_CHANGED_EVENT } from '@/lib/settingsCache';
//   import { renderHook, waitFor } from '@testing-library/react';
//   import { makeSettings } from '../helpers/fixtures';
//
// Nota: la cache es un modulo con estado. Importa el modulo dentro de cada test
// o usa vi.resetModules() para aislar los casos.

describe('U6 - lib/settingsCache.ts', () => {
  it.todo('getSettingsCached llama a la API solo la primera vez');
  it.todo('getSettingsCached comparte la misma promesa si se llama en paralelo');
  it.todo('setSettingsCache evita la llamada a la API');
  it.todo('invalidateSettings limpia la cache y emite SETTINGS_CHANGED_EVENT');
  it.todo('useHotelBrand devuelve null sin settings y el nombre/logo cuando existen');
});
