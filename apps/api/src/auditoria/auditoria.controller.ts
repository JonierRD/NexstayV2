import { BadRequestException, Body, Controller, Delete, ForbiddenException, Get, Param, Query, UseGuards } from '@nestjs/common';
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
    @Query('search') search?: string,
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
      search: search?.trim() || undefined,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined
    });
  }

  @Get('entity/:entity/:entityId')
  async findByEntity(
    @Param('entity') entity: string,
    @Param('entityId') entityId: string,
    @CurrentUser() user?: JwtPayload
  ) {
    // Solo administradores pueden ver logs de cualquier entidad
    if (user?.role !== 'ADMIN') {
      throw new ForbiddenException('No tienes permisos para ver estos logs');
    }

    return this.service.findByEntity(entity, entityId);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() user?: JwtPayload) {
    if (user?.role !== 'ADMIN') {
      throw new ForbiddenException('Solo los administradores pueden eliminar registros de auditoría');
    }

    const numericId = Number(id);
    if (!Number.isInteger(numericId) || numericId <= 0) {
      throw new BadRequestException('El identificador del registro no es válido');
    }

    return this.service.remove(numericId);
  }

  @Delete()
  async removeMany(@Body() body: { ids?: unknown }, @CurrentUser() user?: JwtPayload) {
    if (user?.role !== 'ADMIN') {
      throw new ForbiddenException('Solo los administradores pueden eliminar registros de auditoría');
    }

    if (
      !Array.isArray(body?.ids) ||
      body.ids.length === 0 ||
      body.ids.some((id) => typeof id !== 'number' || !Number.isInteger(id) || id <= 0)
    ) {
      throw new BadRequestException('Debes seleccionar registros válidos para eliminar');
    }

    return this.service.removeMany(body.ids as number[]);
  }
}
