import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtPayload } from '../auth/auth.types';
import { AuditoriaService, AuditAction } from './auditoria.service';

@Controller('auditoria')
@UseGuards(JwtAuthGuard)
export class AuditoriaController {
  constructor(private service: AuditoriaService) {}

  @Get()
  async findAll(
    @Query('userId') userId?: string,
    @Query('action') action?: AuditAction,
    @Query('entity') entity?: string,
    @Query('entityId') entityId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @CurrentUser() user?: JwtPayload
  ) {
    // Solo administradores pueden ver todos los logs
    if (user?.role !== 'ADMIN') {
      userId = user?.sub; // Solo sus propios logs
    }

    return this.service.findAll({
      userId,
      action,
      entity,
      entityId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined
    });
  }

  @Get('entity/:entity/:entityId')
  async findByEntity(
    @Query('entity') entity: string,
    @Query('entityId') entityId: string,
    @CurrentUser() user?: JwtPayload
  ) {
    // Solo administradores pueden ver logs de cualquier entidad
    if (user?.role !== 'ADMIN') {
      throw new Error('No tienes permisos para ver estos logs');
    }

    return this.service.findByEntity(entity, entityId);
  }
}
