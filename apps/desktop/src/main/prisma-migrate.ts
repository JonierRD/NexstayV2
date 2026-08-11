import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { APP_CONFIG, type AppPaths } from './config';

function buildDatabaseUrl(): string {
  const auth = `${APP_CONFIG.pgUser}:${APP_CONFIG.pgPassword}`;
  return `postgresql://${auth}@${APP_CONFIG.pgHost}:${APP_CONFIG.pgPort}/${APP_CONFIG.pgDatabase}?schema=public`;
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

function locatePrismaCli(paths: AppPaths): string {
  const rootModules = path.resolve(paths.apiDistRoot, '..', '..', 'node_modules');
  const cli = path.join(rootModules, 'prisma', 'build', 'index.js');
  if (fs.existsSync(cli)) {
    return cli;
  }

  // Fallback: workspace node_modules (modo dev o packer no los copió)
  const fallback = path.resolve(
    __dirname,
    '..',
    '..',
    '..',
    '..',
    '..',
    'node_modules',
    'prisma',
    'build',
    'index.js'
  );
  return fallback;
}

export async function ensureDatabaseSchema(paths: AppPaths): Promise<void> {
  const nodeBin = findNodeBinary();
  const prismaCli = locatePrismaCli(paths);
  const schema = paths.schemaPath;

  if (!fs.existsSync(prismaCli)) {
    throw new Error(
      `No se encontró el CLI de Prisma en "${prismaCli}". Asegúrate de instalar las dependencias (npm install).`
    );
  }

  return new Promise<void>((resolve, reject) => {
    // Establecer DATABASE_URL en el entorno del proceso actual para que el
    // hijo lo herede. No pasamos `env` a spawn() porque en Windows construir
    // un bloque de entorno personalizado puede causar spawn EINVAL.
    const prevDbUrl = process.env.DATABASE_URL;
    process.env.DATABASE_URL = buildDatabaseUrl();

    // Spawn node directamente contra el entry point JS de Prisma, sin pasar
    // por prisma.cmd. En Windows, spawn de archivos .cmd puede fallar con
    // EINVAL debido al wrapper interno cmd.exe /c.
    const child = spawn(
      nodeBin,
      [prismaCli, 'db', 'push', '--schema', schema, '--skip-generate', '--accept-data-loss'],
      {
        stdio: 'ignore'
      }
    );

    if (prevDbUrl === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = prevDbUrl;
    }

    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`prisma db push falló con código ${code}`));
      }
    });
    child.on('error', (err) => {
      reject(new Error(`Error al ejecutar prisma (${prismaCli}): ${err.message}`));
    });
  });
}