import { Body, Controller, Delete, Get, Param, Patch, Post, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtPayload } from '../auth/auth.types';
import { TankWashService } from './tank-wash.service';
import { CreateTankWashDto } from './dto/create-tank-wash.dto';
import { UpdateTankWashDto } from './dto/update-tank-wash.dto';

@Controller('tank-wash')
@UseGuards(JwtAuthGuard)
export class TankWashController {
  constructor(private service: TankWashService) {}

  @Get()
  async findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.service.findOne(parseInt(id));
  }

  @Post()
  async create(@Body() data: CreateTankWashDto, @CurrentUser() user: JwtPayload) {
    return this.service.create(data, user);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: UpdateTankWashDto, @CurrentUser() user: JwtPayload) {
    return this.service.update(parseInt(id), data, user);
  }

  @Patch(':id/advance')
  async advance(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.service.advanceStatus(parseInt(id), user);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.service.remove(parseInt(id), user);
  }
}
