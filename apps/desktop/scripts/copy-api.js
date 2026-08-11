#!/usr/bin/env node
/**
 * Copia el build de la API (apps/api/dist + node_modules del workspace)
 * hacia apps/desktop/dist-api/ para que electron-builder lo empaque
 * como recurso dentro del instalador de SAPAY Hotel.
 */

import { existsSync, mkdirSync, cpSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const desktopRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(desktopRoot, '..', '..');
const apiRoot = path.join(repoRoot, 'apps', 'api');
const apiDist = path.join(apiRoot, 'dist');
const workspaceNodeModules = path.join(repoRoot, 'node_modules');

const targetRoot = path.join(desktopRoot, 'dist-api');
const targetDist = path.join(targetRoot, 'apps', 'api', 'dist');
const targetNodeModules = path.join(targetRoot, 'node_modules');

function step(message) {
  console.log(`[copy-api] ${message}`);
}

function fail(message) {
  console.error(`[copy-api] ${message}`);
  process.exit(1);
}

if (!existsSync(apiDist)) {
  fail(`No existe ${apiDist}. Ejecuta "npm run build --workspace @sapay/api" primero.`);
}

step('Limpiando dist-api previo...');
rmSync(targetRoot, { recursive: true, force: true });

step(`Copiando build de la API a ${targetDist}...`);
mkdirSync(targetDist, { recursive: true });
cpSync(apiDist, targetDist, { recursive: true });

step(`Copiando node_modules del workspace...`);
mkdirSync(targetNodeModules, { recursive: true });

const apiRuntimeDeps = [
  '@nestjs',
  '@prisma',
  'nest-winston',
  'class-transformer',
  'class-validator',
  'nodemailer',
  'passport',
  'passport-jwt',
  'reflect-metadata',
  'rxjs'
];

for (const dep of apiRuntimeDeps) {
  const from = path.join(workspaceNodeModules, dep);
  const to = path.join(targetNodeModules, dep);
  if (existsSync(from)) {
    cpSync(from, to, { recursive: true });
    step(`  + ${dep}`);
  } else {
    console.warn(`  ! ${dep} no está en el workspace, se omitirá`);
  }
}

// Los binarios (.bin) también son necesarios para prisma
const binsSrc = path.join(workspaceNodeModules, '.bin');
const binsDst = path.join(targetNodeModules, '.bin');
if (existsSync(binsSrc)) {
  cpSync(binsSrc, binsDst, { recursive: true });
  step('  + .bin');
}

step('Listo. Ejecuta "npm run dist" para empaquetar SAPAY Hotel.');