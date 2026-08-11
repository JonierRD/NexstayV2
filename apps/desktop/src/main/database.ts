import path from 'node:path';
import fs from 'node:fs';
import { APP_CONFIG, type AppPaths } from './config';

type EmbeddedPostgresCtor = new (options?: Record<string, unknown>) => {
  initialise(): Promise<void>;
  start(): Promise<void>;
  stop(): Promise<void>;
  createDatabase(name: string): Promise<void>;
  getPgClient(database?: string, host?: string): {
    connect(): Promise<void>;
    query(sql: string, params?: unknown[]): Promise<{ rowCount: number | null }>;
    end(): Promise<void>;
  };
};

type EmbeddedPostgresModule = { default?: EmbeddedPostgresCtor } | EmbeddedPostgresCtor;

// Rollup no debe intentar resolver este import. Usamos new Function para
// que el dynamic import() solo exista en runtime y no se transforme en
// require() en el main process de Electron (CommonJS).
const dynamicImport = new Function('specifier', 'return import(specifier)') as <T = unknown>(
  specifier: string
) => Promise<T>;

async function loadEmbeddedPostgres(): Promise<EmbeddedPostgresCtor> {
  // embedded-postgres se publica como ESM puro, por eso lo cargamos con
  // import() dinámico para que sea compatible con el main process de Electron
  // (CommonJS).
  const mod = (await dynamicImport<EmbeddedPostgresModule>('embedded-postgres')) as
    | EmbeddedPostgresModule
    | { default?: EmbeddedPostgresCtor };
  if (typeof mod === 'function') {
    return mod;
  }
  if ('default' in mod && mod.default) {
    return mod.default;
  }
  throw new Error('No se pudo cargar embedded-postgres.');
}

export type DatabaseHandle = {
  stop: () => Promise<void>;
  ensureDatabaseExists: (dbName: string) => Promise<void>;
};

export async function startEmbeddedPostgres(paths: AppPaths): Promise<DatabaseHandle> {
  const Postgres = await loadEmbeddedPostgres();
  fs.mkdirSync(paths.postgresData, { recursive: true });

  const pg = new Postgres({
    databaseDir: paths.postgresData,
    user: APP_CONFIG.pgUser,
    password: APP_CONFIG.pgPassword,
    port: APP_CONFIG.pgPort,
    authMethod: 'password',
    persistent: true,
    createPostgresUser: false
  });

  const initialised = fs.existsSync(path.join(paths.postgresData, 'PG_VERSION'));
  if (!initialised) {
    await pg.initialise();
  }

  await pg.start();

  return {
    ensureDatabaseExists: async (dbName: string) => {
      // La instancia pg ya está arrancada, podemos usarla directamente.
      let exists = false;
      try {
        const client = pg.getPgClient('postgres', APP_CONFIG.pgHost);
        await client.connect();
        const result = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [
          dbName
        ]);
        await client.end();
        exists = (result.rowCount ?? 0) > 0;
      } catch (error) {
        if (process.env.SAPAY_DEBUG) {
          console.error('[db] No fue posible consultar pg_database:', error);
        }
      }

      if (!exists) {
        await pg.createDatabase(dbName);
      }
    },
    stop: async () => {
      try {
        await pg.stop();
      } catch {
        // ignore
      }
    }
  };
}