import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { execSync } from 'node:child_process';
import path from 'node:path';
import express from 'express';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  // Aplicar migraciones pendientes antes de aceptar operaciones del negocio.
  const schemaDir = path.resolve(__dirname, '..', '..', '..', 'packages', 'database');
  try {
    execSync('npx prisma migrate deploy --schema prisma/schema.prisma', {
      cwd: schemaDir,
      stdio: 'pipe',
      timeout: 30_000
    });
  } catch (error) {
    const output = error && typeof error === 'object' && 'stderr' in error
      ? String((error as { stderr?: Buffer }).stderr ?? '')
      : '';
    // Bases creadas originalmente con `prisma db push` no tienen historial de
    // migraciones. Se marcan como aplicadas solo las migraciones históricas;
    // las nuevas (por ejemplo reservas) siguen ejecutándose normalmente.
    if (output.includes('P3005')) {
      const historicalMigrations = [
        '20260915015034',
        '20260927120000_add_sale_customer_name',
        '20261005120000_semanario',
        '20261008000000_add_cleaning_role'
      ];
      try {
        for (const migration of historicalMigrations) {
          execSync(`npx prisma migrate resolve --applied ${migration} --schema prisma/schema.prisma`, {
            cwd: schemaDir,
            stdio: 'pipe',
            timeout: 30_000
          });
        }
        execSync('npx prisma migrate deploy --schema prisma/schema.prisma', {
          cwd: schemaDir,
          stdio: 'pipe',
          timeout: 30_000
        });
      } catch (baselineError) {
        const detail = baselineError instanceof Error ? baselineError.message : String(baselineError);
        throw new Error(`No se pudieron preparar las migraciones de la base de datos: ${detail}`);
      }
    } else {
      const detail = error instanceof Error ? error.message : String(error);
      throw new Error(`No se pudieron aplicar las migraciones de la base de datos: ${detail}`);
    }
  }

  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const port = config.get<number>('API_PORT') ?? 3333;

  app.enableCors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173']
  });
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  await app.listen(port);
}

void bootstrap();
