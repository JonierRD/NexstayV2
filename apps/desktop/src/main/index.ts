import { join } from 'node:path';
import { app, BrowserWindow, ipcMain } from 'electron';
import { resolvePaths, APP_CONFIG } from './config';
import { startEmbeddedPostgres } from './database';
import { startApi } from './api';
import { ensureDatabaseSchema } from './prisma-migrate';

const paths = resolvePaths();
let mainWindow: BrowserWindow | null = null;
const shutdowns: Array<() => Promise<void>> = [];

async function bootstrap(): Promise<void> {
  app.commandLine.appendSwitch('disable-features', 'OutOfMemoryCrashHandler');

  // Mostrar la ventana inmediatamente para que el usuario vea la app.
  createWindow();

  // Inicializar servicios en segundo plano.
  if (!APP_CONFIG.isDev) {
    const db = await startEmbeddedPostgres(paths);
    shutdowns.push(db.stop);

    await db.ensureDatabaseExists(APP_CONFIG.pgDatabase);
    await ensureDatabaseSchema(paths);
  }

  const api = await startApi(paths);
  shutdowns.push(api.stop);
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 760,
    minWidth: 960,
    minHeight: 640,
    title: 'SAPAY Hotel',
    autoHideMenuBar: true,
    backgroundColor: '#1a0e09',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  if (APP_CONFIG.isDev && process.env.ELECTRON_RENDERER_URL) {
    void mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    void mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

ipcMain.handle('sapay:config', () => ({
  apiUrl: `http://127.0.0.1:${APP_CONFIG.apiPort}`,
  appName: 'SAPAY Hotel'
}));

app.whenReady().then(() => {
  bootstrap().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[sapay] Falló al iniciar:', message);
    if (process.env.SAPAY_DEBUG) {
      console.error(error);
    }
    app.exit(1);
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

let shuttingDown = false;
async function gracefulShutdown(): Promise<void> {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;
  for (const stop of shutdowns.reverse()) {
    try {
      await stop();
    } catch {
      // ignore
    }
  }
  app.quit();
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    void gracefulShutdown();
  }
});

app.on('before-quit', () => {
  void gracefulShutdown();
});

process.on('SIGTERM', () => void gracefulShutdown());
process.on('SIGINT', () => void gracefulShutdown());
