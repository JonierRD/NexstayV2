import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { assertAdminPassword } from '../auth/admin-password';
import type { JwtPayload } from '../auth/auth.types';
import type { CreateHabitacionDto } from './dto/create-habitacion.dto';
import type { UpdateHabitacionDto } from './dto/update-habitacion.dto';
import type { RemoveHabitacionDto } from './dto/remove-habitacion.dto';
import { AuditoriaService, AuditAction } from '../auditoria/auditoria.service';

@Injectable()
export class HabitacionesService {
  constructor(
    private prisma: PrismaService,
    private auditoria: AuditoriaService
  ) {}

  async findAll() {
    return this.prisma.room.findMany({ orderBy: { number: 'asc' } });
  }

  async create(dto: CreateHabitacionDto, user: JwtPayload) {
    if (user.role !== Role.ADMIN) {
      await this.requireAdminPassword(dto.adminPassword);
    }

    const existing = await this.prisma.room.findUnique({ where: { number: dto.number } });
    if (existing) {
      throw new ConflictException(`La habitación ${dto.number} ya existe.`);
    }

    const room = await this.prisma.room.create({
      data: {
        number: dto.number,
        type: dto.type,
        hasAir: dto.hasAir ?? false,
        hasFan: dto.hasFan ?? false,
        priceWithAir: dto.priceWithAir ?? undefined,
        priceWithFan: dto.priceWithFan ?? undefined,
        image: dto.image ?? undefined,
        notes: dto.notes ?? undefined,
        status: 'DISPONIBLE'
      }
    });

    // Registrar en auditoría
    await this.auditoria.log(user, {
      action: 'CREATE',
      entity: 'HABITACION',
      entityId: room.number,
      description: `Creó la habitación ${room.number} tipo ${room.type}`,
      newValue: JSON.stringify(room)
    });

    return room;
  }

  async update(number: string, dto: UpdateHabitacionDto, user: JwtPayload) {
    if (user.role !== Role.ADMIN) {
      await this.requireAdminPassword(dto.adminPassword);
    }

    const room = await this.prisma.room.findUnique({ where: { number } });
    if (!room) {
      throw new NotFoundException(`La habitación ${number} no existe.`);
    }

    // Validación: no permitir cambiar de OCUPADA a DISPONIBLE si hay hospedaje activo
    if (dto.status === 'DISPONIBLE' && room.status === 'OCUPADA') {
      const activeStay = await this.prisma.stay.findFirst({
        where: { roomNumber: number, status: 'ACTIVA' }
      });
      if (activeStay) {
        throw new BadRequestException(
          'No se puede cambiar el estado a DISPONIBLE manualmente. La habitación tiene un hospedaje activo. Utiliza el botón "Liberar" para finalizar el hospedaje.'
        );
      }
    }

    const updatedRoom = await this.prisma.room.update({
      where: { number },
      data: {
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.hasAir !== undefined && { hasAir: dto.hasAir }),
        ...(dto.hasFan !== undefined && { hasFan: dto.hasFan }),
        ...(dto.priceWithAir !== undefined && { priceWithAir: dto.priceWithAir }),
        ...(dto.priceWithFan !== undefined && { priceWithFan: dto.priceWithFan }),
        ...(dto.image !== undefined && { image: dto.image }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
        ...(dto.status !== undefined && { status: dto.status })
      }
    });

    // Registrar en auditoría
    const changes: string[] = [];
    if (dto.type !== undefined && dto.type !== room.type) changes.push(`tipo de ${room.type} a ${dto.type}`);
    if (dto.status !== undefined && dto.status !== room.status) changes.push(`estado de ${room.status} a ${dto.status}`);
    if (dto.hasAir !== undefined && dto.hasAir !== room.hasAir) changes.push(`aire acondicionado`);
    if (dto.hasFan !== undefined && dto.hasFan !== room.hasFan) changes.push(`ventilador`);
    if (dto.priceWithAir !== undefined && Number(dto.priceWithAir) !== Number(room.priceWithAir)) changes.push(`precio con aire`);
    if (dto.priceWithFan !== undefined && Number(dto.priceWithFan) !== Number(room.priceWithFan)) changes.push(`precio con ventilador`);
    if (dto.image !== undefined) changes.push(`imagen`);
    if (dto.notes !== undefined && dto.notes !== room.notes) changes.push(`notas`);

    if (changes.length > 0) {
      await this.auditoria.log(user, {
        action: 'UPDATE',
        entity: 'HABITACION',
        entityId: number,
        description: `Actualizó habitación ${number}: ${changes.join(', ')}`,
        oldValue: JSON.stringify(room),
        newValue: JSON.stringify(updatedRoom)
      });
    }

    return updatedRoom;
  }

  async remove(number: string, dto: RemoveHabitacionDto, user: JwtPayload) {
    if (user.role !== Role.ADMIN) {
      await this.requireAdminPassword(dto.adminPassword);
    }

    const room = await this.prisma.room.findUnique({ where: { number } });
    if (!room) {
      throw new NotFoundException(`La habitación ${number} no existe.`);
    }

    const activeStays = await this.prisma.stay.findFirst({
      where: { roomNumber: number, status: 'ACTIVA' }
    });
    if (activeStays) {
      throw new BadRequestException(
        'No se puede eliminar una habitación con hospedajes activos.'
      );
    }

    await this.prisma.room.delete({ where: { number } });

    // Registrar en auditoría
    await this.auditoria.log(user, {
      action: 'DELETE',
      entity: 'HABITACION',
      entityId: number,
      description: `Eliminó la habitación ${number} tipo ${room.type}`,
      oldValue: JSON.stringify(room)
    });

    return { message: `Habitación ${number} eliminada.` };
  }

  private async requireAdminPassword(password?: string): Promise<void> {
    return assertAdminPassword(this.prisma, password);
  }
}
