import { Injectable, NotFoundException } from '@nestjs/common';
import { $Enums } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { JwtPayload } from '../auth/auth.types';
import { AuditoriaService } from '../auditoria/auditoria.service';

export type LaundryItem = $Enums.LaundryItem;
export type LaundryStatus = $Enums.LaundryStatus;

export interface CreateLaundryInput {
  item: LaundryItem;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  deliveryDate?: Date;
  clientName: string;
  roomNumber?: string;
  notes?: string;
}

export interface UpdateLaundryInput {
  item?: LaundryItem;
  description?: string;
  quantity?: number;
  unitPrice?: number;
  totalPrice?: number;
  status?: LaundryStatus;
  deliveryDate?: Date;
  clientName?: string;
  roomNumber?: string;
  notes?: string;
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

  async create(data: CreateLaundryInput, user: JwtPayload) {
    const laundry = await this.prisma.laundry.create({
      data
    });

    // Registrar en auditoría
    await this.auditoria.log(user, {
      action: 'CREATE',
      entity: 'LAVANDERIA',
      entityId: laundry.id.toString(),
      description: `Creó registro de lavandería: ${data.item} x${data.quantity} para ${data.clientName}`,
      newValue: JSON.stringify(laundry)
    });

    return laundry;
  }

  async update(id: number, data: UpdateLaundryInput, user: JwtPayload) {
    const existing = await this.findOne(id);

    const laundry = await this.prisma.laundry.update({
      where: { id },
      data
    });

    // Registrar en auditoría
    await this.auditoria.log(user, {
      action: 'UPDATE',
      entity: 'LAVANDERIA',
      entityId: id.toString(),
      description: `Actualizó registro de lavandería ID ${id}`,
      oldValue: JSON.stringify(existing),
      newValue: JSON.stringify(laundry)
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
      oldValue: JSON.stringify(existing)
    });

    return { message: 'Registro eliminado' };
  }
}
