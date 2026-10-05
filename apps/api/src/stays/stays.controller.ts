import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtPayload } from '../auth/auth.types';
import { StaysService } from './stays.service';
import { CheckinDto } from './dto/checkin.dto';
import { UpdateStayDto } from './dto/update-stay.dto';

@Controller('stays')
@UseGuards(JwtAuthGuard)
export class StaysController {
  constructor(private service: StaysService) {}

  @Get()
  async findAll() {
    return this.service.findAll();
  }

  @Get('active')
  async findActive() {
    return this.service.findActive();
  }

  @Get('room/:roomNumber')
  async findByRoom(@Param('roomNumber') roomNumber: string) {
    return this.service.findByRoom(roomNumber);
  }

  @Get('client/:cc')
  async findByClient(@Param('cc') cc: string) {
    return this.service.findByClient(cc);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.service.findOne(Number(id));
  }

  @Post('checkin')
  async checkin(@Body() dto: CheckinDto, @CurrentUser() user: JwtPayload) {
    return this.service.checkin(dto, user);
  }

  @Post(':id/checkout')
  async checkout(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto?: { nights?: number }
  ) {
    return this.service.checkout(Number(id), user, dto);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateStayDto,
    @CurrentUser() user: JwtPayload
  ) {
    return this.service.update(Number(id), dto, user);
  }

  @Post(':id/cancel')
  async cancel(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.service.cancel(Number(id), user);
  }
}