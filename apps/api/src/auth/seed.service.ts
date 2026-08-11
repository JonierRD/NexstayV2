import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Role, RoomType, RoomStatus } from '@prisma/client';
import { randomBytes } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { PrismaService } from '../prisma/prisma.service';
import { hashPassword } from './password';

export type SeededAdmin = {
  fullName: string;
  email: string;
  cc: string;
  temporaryPassword: string;
};

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);
  private firstRunMarkerPath = '';
  private seededCredentials: SeededAdmin | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService
  ) {
    // El archivo de credenciales vive junto a la DB del usuario
    const markerDir = this.config.get<string>('SAPAY_USER_DATA');
    if (markerDir) {
      this.firstRunMarkerPath = path.join(markerDir, 'first-run.json');
    }
  }

  async onModuleInit(): Promise<void> {
    await this.seedRooms();

    const userCount = await this.prisma.user.count();

    if (userCount > 0) {
      // Si el archivo de credenciales temporales existe pero ya hay usuarios,
      // significa que el admin ya cambió su contraseña: limpiar.
      if (this.firstRunMarkerPath && fs.existsSync(this.firstRunMarkerPath)) {
        fs.unlinkSync(this.firstRunMarkerPath);
      }
      return;
    }

    const seeded = await this.seedInitialAdmin();
    this.seededCredentials = seeded;
    this.persistSeededCredentials(seeded);

    this.logger.warn(
      `Primer arranque: se creó el administrador inicial ${seeded.email}. La contraseña temporal se guardó para mostrarla al usuario.`
    );

    if (process.env.SAPAY_DEBUG) {
      console.log('[seed] Admin creado:', {
        email: seeded.email,
        temporaryPassword: seeded.temporaryPassword
      });
    }
  }

  hasPendingFirstRun(): boolean {
    return this.seededCredentials !== null && fs.existsSync(this.firstRunMarkerPath);
  }

  getSeededCredentials(): SeededAdmin | null {
    if (!this.hasPendingFirstRun()) {
      return null;
    }
    if (this.seededCredentials) {
      return this.seededCredentials;
    }
    try {
      const raw = fs.readFileSync(this.firstRunMarkerPath, 'utf8');
      return JSON.parse(raw) as SeededAdmin;
    } catch {
      return null;
    }
  }

  clearSeededCredentials(): void {
    if (this.firstRunMarkerPath && fs.existsSync(this.firstRunMarkerPath)) {
      fs.unlinkSync(this.firstRunMarkerPath);
    }
    this.seededCredentials = null;
  }

  private async seedInitialAdmin(): Promise<SeededAdmin> {
    const fullName = this.config.get<string>('SEED_ADMIN_NAME') ?? 'Administrador SAPAY';
    const email = (this.config.get<string>('SEED_ADMIN_EMAIL') ?? 'admin@sapay.local').toLowerCase();
    const cc = this.config.get<string>('SEED_ADMIN_CC') ?? '0000000000';
    const temporaryPassword =
      this.config.get<string>('SEED_ADMIN_PASSWORD') ?? this.generateSecurePassword();

    const passwordHash = await hashPassword(temporaryPassword);

    await this.prisma.user.create({
      data: {
        fullName,
        cc,
        email,
        phone: null,
        role: Role.ADMIN,
        passwordHash,
        isActive: true
      }
    });

    return {
      fullName,
      email,
      cc,
      temporaryPassword
    };
  }

  private persistSeededCredentials(seeded: SeededAdmin): void {
    if (!this.firstRunMarkerPath) {
      return;
    }
    try {
      fs.mkdirSync(path.dirname(this.firstRunMarkerPath), { recursive: true });
      fs.writeFileSync(this.firstRunMarkerPath, JSON.stringify(seeded, null, 2), 'utf8');
    } catch (error) {
      this.logger.error('No se pudo persistir el archivo first-run.json', error as Error);
    }
  }

  private generateSecurePassword(): string {
    // 12 caracteres seguros: letras + números + símbolos, evitando ambigüedades
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
    const bytes = randomBytes(12);
    let password = '';
    for (let i = 0; i < bytes.length; i += 1) {
      password += alphabet[bytes[i] % alphabet.length];
    }
    return password;
  }

  private async seedRooms(): Promise<void> {
    const roomCount = await this.prisma.room.count();
    if (roomCount > 0) {
      await this.prisma.room.updateMany({
        where: {},
        data: { status: RoomStatus.DISPONIBLE }
      });
      this.logger.log('Todas las habitaciones están disponibles.');
      return;
    }

    const rooms: Array<{
      number: string;
      type: RoomType;
      hasAir: boolean;
      hasFan: boolean;
      priceWithAir?: number;
      priceWithFan?: number;
    }> = [
      { number: '101', type: RoomType.DOSCAMAS, hasAir: true, hasFan: true, priceWithAir: 95000, priceWithFan: 85000 },
      { number: '102', type: RoomType.DOSCAMAS, hasAir: true, hasFan: false, priceWithAir: 95000 },
      { number: '112', type: RoomType.DOSCAMAS, hasAir: true, hasFan: false, priceWithAir: 95000 },
      { number: '103', type: RoomType.MATRIMONIAL, hasAir: true, hasFan: false, priceWithAir: 85000 },
      { number: '105', type: RoomType.MATRIMONIAL, hasAir: true, hasFan: true, priceWithAir: 85000, priceWithFan: 75000 },
      { number: '107', type: RoomType.MATRIMONIAL, hasAir: true, hasFan: true, priceWithAir: 85000, priceWithFan: 75000 },
      { number: '109', type: RoomType.MATRIMONIAL, hasAir: true, hasFan: false, priceWithAir: 85000 },
      { number: '201', type: RoomType.MATRIMONIAL, hasAir: true, hasFan: false, priceWithAir: 85000 },
      { number: '202', type: RoomType.MATRIMONIAL, hasAir: true, hasFan: false, priceWithAir: 85000 },
      { number: '203', type: RoomType.MATRIMONIAL, hasAir: true, hasFan: false, priceWithAir: 85000 },
      { number: '204', type: RoomType.MATRIMONIAL, hasAir: true, hasFan: false, priceWithAir: 85000 },
      { number: '104', type: RoomType.SENCILLA, hasAir: true, hasFan: true, priceWithAir: 55000, priceWithFan: 45000 },
      { number: '108', type: RoomType.SENCILLA, hasAir: true, hasFan: true, priceWithAir: 55000, priceWithFan: 45000 },
      { number: '111', type: RoomType.SENCILLA, hasAir: true, hasFan: true, priceWithAir: 55000, priceWithFan: 45000 },
      { number: '106', type: RoomType.SENCILLA, hasAir: true, hasFan: false, priceWithAir: 55000 },
      { number: '110', type: RoomType.SENCILLA, hasAir: true, hasFan: false, priceWithAir: 55000 },
      { number: '113', type: RoomType.SENCILLA, hasAir: true, hasFan: false, priceWithAir: 55000 },
    ];

    await this.prisma.room.createMany({ data: rooms });
    this.logger.log(`Se crearon ${rooms.length} habitaciones iniciales.`);
  }
}