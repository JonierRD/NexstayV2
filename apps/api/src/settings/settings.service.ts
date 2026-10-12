import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { type AppSettingsData, toSettingsData } from './settings.types';

/**
 * Configuracion de la aplicacion (datos del hotel, tema, politicas, IA).
 * Vive en una sola fila (id=1) con valores por defecto; el seed solo la crea
 * si falta para no pisar cambios del administrador.
 */
@Injectable()
export class SettingsService implements OnModuleInit {
  private readonly logger = new Logger(SettingsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.prisma.appSettings.upsert({
        where: { id: 1 },
        update: {},
        create: { id: 1 }
      });
    } catch (error) {
      // Si la tabla aún no existe (primer arranque con migraciones pendientes),
      // el arranque no debe caerse: la configuración se creará bajo demanda.
      this.logger.warn('No se pudo asegurar la fila de configuración.', error as Error);
    }
  }

  async get(): Promise<AppSettingsData> {
    const settings = await this.prisma.appSettings.upsert({
      where: { id: 1 },
      update: {},
      create: { id: 1 }
    });
    return toSettingsData(settings);
  }

  /** Actualiza solo las propiedades enviadas; las demás se conservan. */
  async update(dto: UpdateSettingsDto): Promise<AppSettingsData> {
    const settings = await this.prisma.appSettings.update({
      where: { id: 1 },
      data: {
        hotelName: dto.hotelName,
        hotelNit: dto.hotelNit,
        hotelAddress: dto.hotelAddress,
        hotelPhone: dto.hotelPhone,
        hotelEmail: dto.hotelEmail,
        logoDataUrl: dto.logoDataUrl,
        themeColor: dto.themeColor,
        darkMode: dto.darkMode,
        checkinLimit: dto.checkinLimit,
        checkoutLimit: dto.checkoutLimit,
        checkoutTolerance: dto.checkoutTolerance,
        cancellationPolicy: dto.cancellationPolicy,
        aiEnabled: dto.aiEnabled
      }
    });
    return toSettingsData(settings);
  }
}