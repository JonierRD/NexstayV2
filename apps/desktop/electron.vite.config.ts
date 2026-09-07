
import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig, externalizeDepsPlugin } from 'electron-vite';

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    envDir: resolve(__dirname, '../../')
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    envDir: resolve(__dirname, '../../')
  },
  renderer: {
    envDir: resolve(__dirname, '../../'),
    resolve: {
      alias: {
        '@': resolve('src/renderer/src')
      }
    },
    plugins: [react()]
  }
});
