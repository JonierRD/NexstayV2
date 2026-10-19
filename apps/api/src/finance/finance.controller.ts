import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { $Enums } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtPayload } from '../auth/auth.types';
import { FinanceService } from './finance.service';
import { CreateFinanceMovementDto } from './dto/create-finance-movement.dto';
import { UpdateFinanceMovementDto } from './dto/update-finance-movement.dto';

@Controller('finance')
@UseGuards(JwtAuthGuard)
export class FinanceController {
  constructor(private service: FinanceService) {}

  @Get('movements')
  async listMovements(@Query('type') type?: string) {
    const valid = type === 'INGRESO' || type === 'GASTO' ? (type as $Enums.FinanceMovementType) : undefined;
    return this.service.listMovements(valid);
  }

  @Get('summary')
  async summary() {
    return this.service.summary();
  }

  @Get('movements/:id')
  async findOne(@Param('id') id: string) {
    return this.service.findOne(parseInt(id));
  }

  @Post('movements')
  async create(@Body() data: CreateFinanceMovementDto, @CurrentUser() user: JwtPayload) {
    return this.service.create(data, user);
  }

  @Put('movements/:id')
  async update(@Param('id') id: string, @Body() data: UpdateFinanceMovementDto, @CurrentUser() user: JwtPayload) {
    return this.service.update(parseInt(id), data, user);
  }

  @Delete('movements/:id')
  async remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.service.remove(parseInt(id), user);
  }
}
