import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { $Enums } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { JwtPayload } from '../auth/auth.types';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { CreateTankWashDto } from './dto/create-tank-wash.dto';
import { UpdateTankWashDto } from './dto/update-tank-wash.dto';

export type TankWashStatus = $Enums.TankWashStatus;
export type TankWashType = $Enums.TankWashType;

type TankWashRow = {
  id: number;
  clientName: string;
  roomNumber: string | null;
  tankType: TankWashType;
  serviceDate: Date;
  amount: unknown;
  status: TankWashStatus;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

// Prisma.Decimal viaja como string en JSON; el front espera numeros.
function serialize(row: TankWashRow) {
  return { ...row, amount: Number(row.amount) };
}

// Las columnas @db.Date exigen medianoche UTC para que la fecha no se
// corrija un dia al mostrarse desde America/Bogota.
function toUtcDate(isoDate: string): Date {
  return new Date(`${isoDate.slice(0, 10)}T00:00:00.000Z`);
}

const NEXT_STATUS: Record<TankWashStatus, TankWashStatus | null> = {
  PENDIENTE: 'EN_PROCESO',
  EN_PROCESO: 'COMPLETADO',
  COMPLETADO: null
};

@Injectable()
export class TankWashService {
  constructor(
    private prisma: PrismaService,
    private auditoria: AuditoriaService
  ) {}

  async findAll() {
    const rows = await this.prisma.tankWash.findMany({
      orderBy: [{ serviceDate: 'desc' }, { createdAt: 'desc' }]
    });
    return rows.map(serialize);
  }

  async findOne(id: number) {
    const row = await this.prisma.tankWash.findUnique({ where: { id } });
    if (!row) {
      throw new NotFoundException('Servicio de lavado de tanque no encontrado.');
    }
    return serialize(row);
  }

  async create(data: CreateTankWashDto, user: JwtPayload) {
    const row = await this.prisma.tankWash.create({
      data: {
        clientName: data.clientName.trim(),
        roomNumber: data.roomNumber?.trim() || null,
        tankType: data.tankType,
        serviceDate: data.serviceDate ? toUtcDate(data.serviceDate) : new Date(),
        amount: data.amount,
        notes: data.notes?.trim() || null
      }
    });

    await this.auditoria.log(user, {
      action: 'CREATE',
      entity: 'LAVADO_TANQUE',
      entityId: row.id.toString(),
      description: `Creó servicio de lavado de tanque: ${data.tankType} para ${row.clientName}.`,
      newValue: row
    });

    return serialize(row);
  }

  async update(id: number, data: UpdateTankWashDto, user: JwtPayload) {
    const existing = await this.prisma.tankWash.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Servicio de lavado de tanque no encontrado.');
    }

    const row = await this.prisma.tankWash.update({
      where: { id },
      data: {
        clientName: data.clientName?.trim(),
        roomNumber: data.roomNumber !== undefined ? data.roomNumber.trim() || null : undefined,
        tankType: data.tankType,
        serviceDate: data.serviceDate ? toUtcDate(data.serviceDate) : undefined,
        amount: data.amount,
        status: data.status,
        notes: data.notes !== undefined ? data.notes.trim() || null : undefined
      }
    });

    await this.auditoria.log(user, {
      action: 'UPDATE',
      entity: 'LAVADO_TANQUE',
      entityId: id.toString(),
      description: `Actualizó servicio de lavado de tanque ID ${id}.`,
      oldValue: existing,
      newValue: row
    });

    return serialize(row);
  }

  // Avance de estado con transicion validada: PENDIENTE -> EN_PROCESO -> COMPLETADO.
  async advanceStatus(id: number, user: JwtPayload) {
    const existing = await this.prisma.tankWash.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Servicio de lavado de tanque no encontrado.');
    }

    const next = NEXT_STATUS[existing.status];
    if (!next) {
      throw new BadRequestException('El servicio ya está completado.');
    }

    const row = await this.prisma.tankWash.update({
      where: { id },
      data: { status: next }
    });

    await this.auditoria.log(user, {
      action: 'UPDATE',
      entity: 'LAVADO_TANQUE',
      entityId: id.toString(),
      description: `Servicio de lavado de tanque ID ${id}: ${existing.status} → ${next}.`,
      oldValue: { status: existing.status },
      newValue: { status: next }
    });

    return serialize(row);
  }

  async remove(id: number, user: JwtPayload) {
    const existing = await this.prisma.tankWash.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Servicio de lavado de tanque no encontrado.');
    }

    await this.prisma.tankWash.delete({ where: { id } });

    await this.auditoria.log(user, {
      action: 'DELETE',
      entity: 'LAVADO_TANQUE',
      entityId: id.toString(),
      description: `Eliminó servicio de lavado de tanque ID ${id}.`,
      oldValue: existing
    });

    return { message: 'Servicio eliminado.' };
  }
}
