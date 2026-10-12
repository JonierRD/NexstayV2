import { getSettingsRequest } from './api/settings';
import type { ThemeColor } from './api/settings';

export type { ThemeColor } from './api/settings';

export const THEME_LABELS: Record<ThemeColor, string> = {
  cafe: 'Café (clásico)',
  verde: 'Verde',
  azul: 'Azul'
};

const THEME_STORAGE_KEY = 'sapay-theme';

function persistTheme(themeColor: ThemeColor, darkMode: boolean): void {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify({ themeColor, darkMode }));
  } catch {
    // ignore
  }
}

export function applyTheme(input: { themeColor?: ThemeColor; darkMode?: boolean }): void {
  const themeColor = input.themeColor ?? 'cafe';
  const darkMode = input.darkMode === true;
  const root = document.documentElement;
  root.dataset.theme = themeColor;
  root.classList.toggle('dark', darkMode);
  root.style.removeProperty('font-size');
  delete root.dataset.fontScale;
  persistTheme(themeColor, darkMode);
}

/**
 * Aplica el ultimo tema conocido guardado localmente. Se ejecuta de forma
 * sincrona antes de montar React para que la app no arranque en cafe cuando la
 * API aun no responde (ventana y servicios se levantan en paralelo).
 */
export function applyStoredTheme(): void {
  try {
    const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (!raw) {
      return;
    }
    const parsed = JSON.parse(raw) as { themeColor?: ThemeColor; darkMode?: boolean };
    const themeColor = parsed.themeColor ?? 'cafe';
    const darkMode = parsed.darkMode === true;
    const root = document.documentElement;
    root.dataset.theme = themeColor;
    root.classList.toggle('dark', darkMode);
    root.style.removeProperty('font-size');
    delete root.dataset.fontScale;
  } catch {
    // ignore
  }
}

export function isDarkModeActive(): boolean {
  return document.documentElement.classList.contains('dark');
}

/**
 * Aplica el tema guardado (color + modo oscuro) antes de mostrar la app, y
 * valida que la configuracion exista: crea los valores por defecto si el
 * servidor aun no tiene la fila.
 */
export async function ensureInitialTheme(): Promise<void> {
  try {
    const settings = await getSettingsRequest();
    applyTheme({ themeColor: settings.themeColor, darkMode: settings.darkMode });
  } catch {
    // Si la API aun no responde (arranque) no pisamos el tema guardado; solo
    // caemos a cafe cuando nunca hubo uno.
    if (!window.localStorage.getItem(THEME_STORAGE_KEY)) {
      applyTheme({ themeColor: 'cafe', darkMode: false });
    }
  }
}