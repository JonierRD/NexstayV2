import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtPayload } from '../auth/auth.types';
import { HabitacionesService } from './habitaciones.service';
import { CreateHabitacionDto } from './dto/create-habitacion.dto';
import { UpdateHabitacionDto } from './dto/update-habitacion.dto';
import { RemoveHabitacionDto } from './dto/remove-habitacion.dto';

@Controller('habitaciones')
@UseGuards(JwtAuthGuard)
export class HabitacionesController {
  constructor(private service: HabitacionesService) {}

  @Get()
  async findAll() {
    return this.service.findAll();
  }

  @Post()
  async create(@Body() dto: CreateHabitacionDto, @CurrentUser() user: JwtPayload) {
    return this.service.create(dto, user);
  }

  @Patch(':number')
  async update(
    @Param('number') number: string,
    @Body() dto: UpdateHabitacionDto,
    @CurrentUser() user: JwtPayload
  ) {
    return this.service.update(number, dto, user);
  }

  @Post(':number/delete')
  async remove(
    @Param('number') number: string,
    @Body() dto: RemoveHabitacionDto,
    @CurrentUser() user: JwtPayload
  ) {
    return this.service.remove(number, dto, user);
  }
}
