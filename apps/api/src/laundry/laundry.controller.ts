import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtPayload } from '../auth/auth.types';
import { LaundryService } from './laundry.service';
import { CreateLaundryDto } from './dto/create-laundry.dto';
import { UpdateLaundryDto } from './dto/update-laundry.dto';

@Controller('laundry')
@UseGuards(JwtAuthGuard)
export class LaundryController {
  constructor(private service: LaundryService) {}

  @Get()
  async findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.service.findOne(parseInt(id));
  }

  @Post()
  async create(@Body() data: CreateLaundryDto, @CurrentUser() user: JwtPayload) {
    return this.service.create(data, user);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: UpdateLaundryDto, @CurrentUser() user: JwtPayload) {
    return this.service.update(parseInt(id), data, user);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.service.remove(parseInt(id), user);
  }
}
