import { Injectable, NotFoundException } from '@nestjs/common';
import { $Enums } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { JwtPayload } from '../auth/auth.types';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { CreateLaundryDto } from './dto/create-laundry.dto';
import { UpdateLaundryDto } from './dto/update-laundry.dto';

export type LaundryItem = $Enums.LaundryItem;
export type LaundryStatus = $Enums.LaundryStatus;

// El DTO expone deliveryDate como string ISO (IsDateString); Prisma exige Date.
function toPrismaData<T extends { deliveryDate?: string }>(dto: T): Omit<T, 'deliveryDate'> & {
  deliveryDate?: Date;
} {
  const { deliveryDate, ...rest } = dto;
  return {
    ...rest,
    ...(deliveryDate ? { deliveryDate: new Date(deliveryDate) } : {})
  };
}

@Injectable()
export class LaundryService {
  constructor(
    private prisma: PrismaService,
    private auditoria: AuditoriaService
  ) {}

  async findAll() {
    return this.prisma.laundry.findMany({
      orderBy: { createdAt: 'desc' }
    });
  }

  async findOne(id: number) {
    const laundry = await this.prisma.laundry.findUnique({ where: { id } });
    if (!laundry) {
      throw new NotFoundException('Registro de lavandería no encontrado');
    }
    return laundry;
  }

  async create(data: CreateLaundryDto, user: JwtPayload) {
    const laundry = await this.prisma.laundry.create({
      data: toPrismaData(data)
    });

    // Registrar en auditoría
    await this.auditoria.log(user, {
      action: 'CREATE',
      entity: 'LAVANDERIA',
      entityId: laundry.id.toString(),
      description: `Creó registro de lavandería: ${data.item} x${data.quantity} para ${data.clientName}`,
      newValue: laundry
    });

    return laundry;
  }

  async update(id: number, data: UpdateLaundryDto, user: JwtPayload) {
    const existing = await this.findOne(id);

    const laundry = await this.prisma.laundry.update({
      where: { id },
      data: toPrismaData(data)
    });

    // Registrar en auditoría
    await this.auditoria.log(user, {
      action: 'UPDATE',
      entity: 'LAVANDERIA',
      entityId: id.toString(),
      description: `Actualizó registro de lavandería ID ${id}`,
      oldValue: existing,
      newValue: laundry
    });

    return laundry;
  }

  async remove(id: number, user: JwtPayload) {
    const existing = await this.findOne(id);

    await this.prisma.laundry.delete({ where: { id } });

    // Registrar en auditoría
    await this.auditoria.log(user, {
      action: 'DELETE',
      entity: 'LAVANDERIA',
      entityId: id.toString(),
      description: `Eliminó registro de lavandería ID ${id}`,
      oldValue: existing
    });

    return { message: 'Registro eliminado' };
  }
}
