import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// Raiz del paquete (este archivo vive en apps/desktop). Se usa fileURLToPath
// en lugar de __dirname porque el config se carga como ESM (.mts).
const packageRoot = fileURLToPath(new URL('.', import.meta.url));

// Configuracion de pruebas del renderer (frontend).
// No toca el proceso main/preload de Electron: el alcance es la UI y su logica.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(packageRoot, 'src/renderer/src')
    }
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}'],
    restoreMocks: true,
    clearMocks: true,
    testTimeout: 10000,
    hookTimeout: 10000,
    // Salida agrupada por unitarias/integracion y con el dueno de cada archivo.
    reporters: ['./tests/reporters/grouped.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      reportsDirectory: './coverage',
      include: ['src/renderer/src/**/*.{ts,tsx}'],
      exclude: ['src/renderer/src/**/*.d.ts', 'src/renderer/src/main.tsx']
    }
  }
});
