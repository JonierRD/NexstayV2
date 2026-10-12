import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../auth/admin.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { JwtPayload } from '../auth/auth.types';
import { CreateParkingSessionDto } from './dto/create-parking-session.dto';
import { CreateVehicleTypeDto } from './dto/create-vehicle-type.dto';
import { UpdateVehicleTypeDto } from './dto/update-vehicle-type.dto';
import { ParkingService } from './parking.service';

@Controller('parking')
@UseGuards(JwtAuthGuard)
export class ParkingController {
  constructor(private readonly service: ParkingService) {}

  @Get('vehicle-types')
  listVehicleTypes() { return this.service.listVehicleTypes(); }

  @Post('vehicle-types')
  @UseGuards(AdminGuard)
  createVehicleType(@Body() dto: CreateVehicleTypeDto, @CurrentUser() user: JwtPayload) { return this.service.createVehicleType(dto, user); }

  @Patch('vehicle-types/:id')
  @UseGuards(AdminGuard)
  updateVehicleType(@Param('id') id: string, @Body() dto: UpdateVehicleTypeDto, @CurrentUser() user: JwtPayload) { return this.service.updateVehicleType(Number(id), dto, user); }

  @Delete('vehicle-types/:id')
  @UseGuards(AdminGuard)
  removeVehicleType(@Param('id') id: string, @CurrentUser() user: JwtPayload) { return this.service.removeVehicleType(Number(id), user); }

  @Get('sessions')
  listSessions() { return this.service.listSessions(); }

  @Post('sessions')
  createSession(@Body() dto: CreateParkingSessionDto, @CurrentUser() user: JwtPayload) { return this.service.createSession(dto, user); }

  @Post('sessions/:id/exit')
  closeSession(@Param('id') id: string, @CurrentUser() user: JwtPayload) { return this.service.closeSession(Number(id), user); }

  @Delete('sessions/:id')
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) { return this.service.remove(Number(id), user); }

  @Delete('sessions')
  removeMany(@Body() body: { ids?: unknown }, @CurrentUser() user: JwtPayload) {
    if (!Array.isArray(body.ids) || body.ids.length === 0 || body.ids.some((id) => typeof id !== 'number' || !Number.isInteger(id) || id <= 0)) {
      throw new BadRequestException('Debes seleccionar movimientos válidos para eliminar.');
    }
    return this.service.removeMany(body.ids, user);
  }
}
