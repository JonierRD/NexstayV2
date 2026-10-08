import { Body, Controller, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtPayload } from '../auth/auth.types';
import { ParkingService } from './parking.service';
import { CreateParkingSessionDto } from './dto/create-parking-session.dto';
import { UpdateParkingRatesDto } from './dto/update-parking-rates.dto';

@Controller('parking')
@UseGuards(JwtAuthGuard)
export class ParkingController {
  constructor(private service: ParkingService) {}

  @Get('rates')
  getRates() {
    return this.service.getRates();
  }

  @Put('rates')
  updateRates(@Body() dto: UpdateParkingRatesDto, @CurrentUser() user: JwtPayload) {
    return this.service.updateRates(dto, user);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(Number(id));
  }

  @Post()
  create(@Body() dto: CreateParkingSessionDto, @CurrentUser() user: JwtPayload) {
    return this.service.startSession(dto, user);
  }

  @Post(':id/checkout')
  checkout(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.service.checkout(Number(id), user);
  }

  @Post(':id/pay')
  pay(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.service.pay(Number(id), user);
  }
}