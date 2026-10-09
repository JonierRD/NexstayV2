import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { AdminGuard } from '../auth/admin.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { JwtPayload } from '../auth/auth.types';
import { SettingsService } from './settings.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import type { AppSettingsData } from './settings.types';

@Controller('settings')
export class SettingsController {
  constructor(
    private readonly settingsService: SettingsService,
    private readonly auditoria: AuditoriaService
  ) {}

  /** Público: el tema y el nombre del hotel se aplican incluso antes del login. */
  @Get()
  get(): Promise<AppSettingsData> {
    return this.settingsService.get();
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Put()
  async update(
    @Body() dto: UpdateSettingsDto,
    @CurrentUser() user: JwtPayload
  ): Promise<AppSettingsData> {
    const previous = await this.settingsService.get();
    const updated = await this.settingsService.update(dto);

    await this.auditoria.log(user, {
      action: 'UPDATE',
      entity: 'AppSettings',
      entityId: '1',
      oldValue: previous,
      newValue: updated,
      description: 'Actualizó la configuración del sistema.',
      ipAddress: undefined
    });

    return updated;
  }
}