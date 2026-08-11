import { spawn, type ChildProcessByStdio } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import type { Readable } from 'node:stream';
import { APP_CONFIG, type AppPaths } from './config';

export type ApiHandle = {
  stop: () => Promise<void>;
};

function buildDatabaseUrl(): string {
  const auth = `${APP_CONFIG.pgUser}:${APP_CONFIG.pgPassword}`;
  return `postgresql://${auth}@${APP_CONFIG.pgHost}:${APP_CONFIG.pgPort}/${APP_CONFIG.pgDatabase}?schema=public`;
}

function streamChildOutput(stream: Readable, prefix: string): void {
  const rl = readline.createInterface({ input: stream });
  rl.on('line', (line) => {
    if (process.env.SAPAY_DEBUG) {
      console.log(`[${prefix}] ${line}`);
    }
  });
}

async function waitForApi(port: number, timeoutMs: number): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/health`);
      if (res.ok) {
        return;
      }
    } catch {
      // retry
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`La API no respondió en el puerto ${port} luego de ${timeoutMs}ms.`);
}

function findNodeBinary(): string {
  if (process.platform === 'win32') {
    const execDir = path.dirname(process.execPath);
    const nodeExe = path.join(execDir, 'node.exe');
    if (fs.existsSync(nodeExe)) {
      return nodeExe;
    }
  }
  return process.execPath;
}

export async function startApi(paths: AppPaths): Promise<ApiHandle> {
  if (APP_CONFIG.isDev) {
    // En desarrollo la API ya la levanta concurrently con "nest start --watch".
    // Solo esperamos a que responda.
    console.log('[api] Modo desarrollo: esperando a que la API externa esté lista...');
    await waitForApi(APP_CONFIG.apiPort, 120_000);
    console.log('[api] API externa lista.');

    return {
      stop: async () => {
        // No matamos la API porque la maneja concurrently.
      }
    };
  }

  const entry = paths.apiEntry;
  const nodeBin = findNodeBinary();

  if (!fs.existsSync(nodeBin)) {
    throw new Error(
      `No se encontró Node.js en "${nodeBin}". Verifica la instalación.`
    );
  }

  // Establecer variables de entorno en process.env para que el hijo las
  // herede de forma natural, evitando spawn EINVAL en Windows al no tener
  // que construir un bloque de entorno personalizado.
  const envBackup: Record<string, string | undefined> = {};
  const setEnv = (key: string, value: string) => {
    envBackup[key] = process.env[key];
    process.env[key] = value;
  };

  setEnv('DATABASE_URL', buildDatabaseUrl());
  setEnv('API_PORT', String(APP_CONFIG.apiPort));
  setEnv('NODE_ENV', 'production');
  setEnv('ELECTRON_RUN_AS_NODE', '1');
  setEnv('SAPAY_USER_DATA', paths.userData);
  setEnv('JWT_SECRET', process.env.JWT_SECRET ?? 'sapay-prod-secret-change-me');
  setEnv('JWT_EXPIRES_IN', process.env.JWT_EXPIRES_IN ?? '12h');
  setEnv('SMTP_HOST', process.env.SMTP_HOST ?? '');
  setEnv('SMTP_PORT', process.env.SMTP_PORT ?? '465');
  setEnv('SMTP_SECURE', process.env.SMTP_SECURE ?? 'true');
  setEnv('SMTP_USER', process.env.SMTP_USER ?? '');
  setEnv('SMTP_PASS', process.env.SMTP_PASS ?? '');
  setEnv('SMTP_FROM', process.env.SMTP_FROM ?? '');

  const child: ChildProcessByStdio<null, Readable, Readable> = spawn(
    nodeBin,
    [entry],
    {
      stdio: ['ignore', 'pipe', 'pipe']
    }
  );

  // Restaurar variables originales inmediatamente (el hijo ya las heredó)
  for (const [key, value] of Object.entries(envBackup)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }

  if (child.stdout) {
    streamChildOutput(child.stdout, 'api');
  }
  if (child.stderr) {
    streamChildOutput(child.stderr, 'api-err');
  }

  child.on('exit', (code, signal) => {
    if (process.env.SAPAY_DEBUG) {
      console.log(`[api] exited code=${code} signal=${signal}`);
    }
  });

  const apiStarted = waitForApi(APP_CONFIG.apiPort, 60_000);

  await Promise.race([
    apiStarted,
    new Promise<void>((_, reject) => {
      child.on('error', (err) => reject(err));
    })
  ]);

  return {
    stop: () =>
      new Promise<void>((resolve) => {
        if (child.exitCode !== null) {
          resolve();
          return;
        }
        child.once('exit', () => resolve());
        child.kill();
        setTimeout(() => {
          if (child.exitCode === null) {
            child.kill('SIGKILL');
            resolve();
          }
        }, 5_000);
      })
  };
}