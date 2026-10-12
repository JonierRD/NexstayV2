import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtPayload } from '../auth/auth.types';
import { ReservationsService } from './reservations.service';
import { CancelReservationDto, CreateReservationDto, UpdateReservationDto } from './dto/create-reservation.dto';

@Controller('reservations')
@UseGuards(JwtAuthGuard)
export class ReservationsController {
  constructor(private readonly service: ReservationsService) {}

  @Get()
  findAll(@Query('status') status?: string) {
    return this.service.findAll(status);
  }

  @Get('availability')
  availability(
    @Query('checkIn') checkIn: string,
    @Query('checkOut') checkOut: string,
    @Query('excludeReservationId') excludeReservationId?: string
  ) {
    return this.service.availability(checkIn, checkOut, excludeReservationId);
  }

  @Get('client/:cc')
  findByCc(@Param('cc') cc: string) {
    return this.service.findByCc(cc);
  }

  @Post()
  create(@Body() dto: CreateReservationDto, @CurrentUser() user: JwtPayload) {
    return this.service.create(dto, user);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateReservationDto, @CurrentUser() user: JwtPayload) {
    return this.service.update(id, dto, user);
  }

  @Post(':id/cancel')
  cancel(@Param('id', ParseIntPipe) id: number, @Body() dto: CancelReservationDto, @CurrentUser() user: JwtPayload) {
    return this.service.cancel(id, dto, user);
  }

  @Post(':id/checkin')
  checkin(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtPayload) {
    return this.service.checkin(id, user);
  }
}
