import { getSettingsRequest } from './api/settings';
import type { ThemeColor } from './api/settings';

export type { ThemeColor } from './api/settings';

export const THEME_LABELS: Record<ThemeColor, string> = {
  cafe: 'Café (clásico)',
  verde: 'Verde',
  azul: 'Azul'
};

export function applyTheme(input: { themeColor?: ThemeColor; darkMode?: boolean }): void {
  const root = document.documentElement;
  root.dataset.theme = input.themeColor ?? 'cafe';
  root.classList.toggle('dark', input.darkMode === true);
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
    applyTheme({ themeColor: 'cafe', darkMode: false });
  }
}