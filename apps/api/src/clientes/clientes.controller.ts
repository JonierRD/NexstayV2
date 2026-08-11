import { Body, Controller, Get, Param, Post, Put, Delete, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtPayload } from '../auth/auth.types';
import { ClientesService } from './clientes.service';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';

@Controller('clientes')
@UseGuards(JwtAuthGuard)
export class ClientesController {
  constructor(private service: ClientesService) {}

  @Get()
  async findAll() {
    return this.service.findAll();
  }

  @Get('cc/:cc')
  async findByCc(@Param('cc') cc: string) {
    return this.service.findByCc(cc);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.service.findOne(Number(id));
  }

  @Post()
  async create(@Body() dto: CreateClienteDto, @CurrentUser() user: JwtPayload) {
    return this.service.create(dto, user);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateClienteDto,
    @CurrentUser() user: JwtPayload
  ) {
    return this.service.update(Number(id), dto, user);
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @Body('adminPassword') adminPassword: string,
    @CurrentUser() user: JwtPayload
  ) {
    return this.service.remove(Number(id), adminPassword, user);
  }
}