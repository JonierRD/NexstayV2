import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { execSync } from 'node:child_process';
import path from 'node:path';
import express from 'express';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  // Sincronizar el schema de Prisma con esta base de datos antes de iniciar.
  const schemaDir = path.resolve(__dirname, '..', '..', '..', 'packages', 'database');
  try {
    execSync('npx prisma db push --skip-generate --accept-data-loss', {
      cwd: schemaDir,
      stdio: 'pipe',
      timeout: 30_000
    });
  } catch {
    // Si falla (ej. DB no disponible aún), el SeedService lo reintentará.
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
