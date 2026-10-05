import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtPayload } from '../auth/auth.types';
import { SemanarioService } from './semanario.service';
import { RangoQueryDto } from './dto/rango-query.dto';
import { GenerarRangoDto } from './dto/generar-rango.dto';
import { GuardarSemanaDto } from './dto/guardar-semana.dto';
import { CeldaDto, CeldaQueryDto } from './dto/guardar-celda.dto';
import { CreateRecepcionistaDto } from './dto/create-recepcionista.dto';
import { UpdateRecepcionistaDto } from './dto/update-recepcionista.dto';
import { ReordenarRosterDto } from './dto/reordenar-roster.dto';

/**
 * ADMIN escribe el semanario; RECEPTION solo lo consulta. El JwtAuthGuard va
 * siempre primero y el AdminGuard pegado a cada escritura: es la validación
 * real, el frontend solo oculta botones.
 */
@Controller('semanario')
@UseGuards(JwtAuthGuard)
export class SemanarioController {
  constructor(private service: SemanarioService) {}

  @Get()
  findAll(@Query() filtros: RangoQueryDto) {
    return this.service.findAll(filtros);
  }

  // ---------- Escritura del horario (solo ADMIN) ----------

  @Post('generar-rango')
  @UseGuards(AdminGuard)
  generarRango(@Body() data: GenerarRangoDto, @CurrentUser() user: JwtPayload) {
    return this.service.generarRango(data, user);
  }

  @Put('asignaciones')
  @UseGuards(AdminGuard)
  guardarSemana(@Body() data: GuardarSemanaDto, @CurrentUser() user: JwtPayload) {
    return this.service.guardarSemana(data, user);
  }

  @Put('asignaciones/celda')
  @UseGuards(AdminGuard)
  guardarCelda(@Body() data: CeldaDto, @CurrentUser() user: JwtPayload) {
    return this.service.guardarCelda(data, user);
  }

  @Delete('asignaciones/celda')
  @UseGuards(AdminGuard)
  borrarCelda(@Query() query: CeldaQueryDto, @CurrentUser() user: JwtPayload) {
    return this.service.borrarCelda(query.semanaId, query.fecha, query.turno, user);
  }

  // ---------- Vaciar y eliminar (solo ADMIN) ----------

  /** Vacía los 14 turnos de una semana y la deja en el grid, sin horario. */
  @Delete('semanas/:id/asignaciones')
  @UseGuards(AdminGuard)
  vaciarSemana(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtPayload) {
    return this.service.vaciarSemana(id, user);
  }

  /** Elimina la semana del grid. */
  @Delete('semanas/:id')
  @UseGuards(AdminGuard)
  eliminarSemana(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtPayload) {
    return this.service.eliminarSemana(id, user);
  }

  /** Elimina las semanas del grid; el roster de recepcionistas se conserva. */
  @Delete()
  @UseGuards(AdminGuard)
  vaciarTodo(@CurrentUser() user: JwtPayload) {
    return this.service.vaciarTodo(user);
  }

  // ---------- Roster (solo ADMIN) ----------

  /** Vacía los turnos de las semanas. Las semanas y las recepcionistas se conservan. */
  @Delete('turnos')
  @UseGuards(AdminGuard)
  vaciarTurnos(@CurrentUser() user: JwtPayload) {
    return this.service.vaciarRoster(user);
  }

  @Put('recepcionistas/orden')
  @UseGuards(AdminGuard)
  reordenarRoster(@Body() data: ReordenarRosterDto, @CurrentUser() user: JwtPayload) {
    return this.service.reordenarRoster(data.ids, user);
  }

  @Post('recepcionistas')
  @UseGuards(AdminGuard)
  crearRecepcionista(
    @Body() data: CreateRecepcionistaDto,
    @CurrentUser() user: JwtPayload
  ) {
    return this.service.crearRecepcionista(data, user);
  }

  @Put('recepcionistas/:id')
  @UseGuards(AdminGuard)
  actualizarRecepcionista(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateRecepcionistaDto,
    @CurrentUser() user: JwtPayload
  ) {
    return this.service.actualizarRecepcionista(id, data, user);
  }

  /** La deja de participar en la rotación pero conserva su horario histórico. */
  @Delete('recepcionistas/:id')
  @UseGuards(AdminGuard)
  desactivarRecepcionista(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload
  ) {
    return this.service.desactivarRecepcionista(id, user);
  }

  /** La borra del roster; sus turnos quedan vacíos. Ruta aparte porque el verbo HTTP ya está usado. */
  @Post('recepcionistas/:id/eliminar')
  @UseGuards(AdminGuard)
  eliminarRecepcionista(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload
  ) {
    return this.service.eliminarRecepcionista(id, user);
  }
}