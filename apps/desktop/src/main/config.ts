import path from 'node:path';
import fs from 'node:fs';
import { app } from 'electron';

const isDev = Boolean(process.env.ELECTRON_RENDERER_URL);

export type AppPaths = {
  userData: string;
  postgresData: string;
  postgresBinaries: string;
  postgresLog: string;
  postgresSocketDir: string;
  apiEntry: string;
  apiDistRoot: string;
  schemaPath: string;
  resourcesDir: string;
  devApiDist: string;
};

export function resolvePaths(): AppPaths {
  const userData = app.getPath('userData');

  // En modo empaquetado, electron-builder coloca recursos extra en
  // process.resourcesPath/<from>. El paquete define extraResources "dist-api"
  // -> "<resources>/app/apps/api/dist".
  const resourcesRoot = process.resourcesPath ?? '';
  const packagedApiDist = path.join(resourcesRoot, 'app', 'apps', 'api', 'dist');
  const packagedSchema = path.join(resourcesRoot, 'app', 'packages', 'database', 'prisma', 'schema.prisma');

  const devApiDist = path.resolve(__dirname, '..', '..', '..', '..', 'apps', 'api');
  const devSchema = path.resolve(
    __dirname,
    '..',
    '..',
    '..',
    '..',
    'packages',
    'database',
    'prisma',
    'schema.prisma'
  );

  return {
    userData,
    postgresData: path.join(userData, 'postgres-data'),
    postgresBinaries: path.join(userData, 'postgres-binaries'),
    postgresLog: path.join(userData, 'postgres.log'),
    postgresSocketDir: path.join(userData, 'postgres-sockets'),
    resourcesDir: isDev ? path.resolve(__dirname, '..', '..', '..', '..') : path.join(resourcesRoot, 'app'),
    devApiDist,
    apiEntry: isDev
      ? path.join(devApiDist, 'dist', 'main.js')
      : path.join(packagedApiDist, 'main.js'),
    apiDistRoot: isDev ? devApiDist : packagedApiDist,
    schemaPath: fs.existsSync(packagedSchema) ? packagedSchema : devSchema
  };
}

export const APP_CONFIG = {
  apiPort: Number(process.env.API_PORT ?? 3333),
  pgPort: Number(process.env.PG_PORT ?? 5444),
  pgUser: process.env.PG_USER ?? 'sapay',
  pgPassword: process.env.PG_PASSWORD ?? 'sapay',
  pgDatabase: process.env.PG_DATABASE ?? 'sapay',
  pgHost: '127.0.0.1',
  isDev
};
