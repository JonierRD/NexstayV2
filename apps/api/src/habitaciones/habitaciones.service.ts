import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
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
    const rooms = await this.prisma.room.findMany({ orderBy: { number: 'asc' } });
    const today = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit'
    }).format(new Date());
    const start = new Date(`${today}T00:00:00.000Z`);
    const end = new Date(start.getTime() + 86_400_000);
    const arrivals = await this.prisma.reservation.findMany({
      where: { status: 'CONFIRMADA', checkIn: { gte: start, lt: end } },
      select: { roomNumber: true }
    });
    const reservedToday = new Set(arrivals.map((reservation) => reservation.roomNumber));
    return rooms.map((room) => room.status === 'DISPONIBLE' && reservedToday.has(room.number)
      ? { ...room, status: 'RESERVADA' as const }
      : room);
  }

  async create(dto: CreateHabitacionDto, user: JwtPayload) {
    if (user.role !== Role.ADMIN && (dto.priceWithAir !== undefined || dto.priceWithFan !== undefined)) {
      throw new ForbiddenException('Solo un administrador puede configurar tarifas de habitaciones.');
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
      newValue: room
    });

    return room;
  }

  async update(number: string, dto: UpdateHabitacionDto, user: JwtPayload) {
    if (user.role !== Role.ADMIN && (dto.priceWithAir !== undefined || dto.priceWithFan !== undefined)) {
      throw new ForbiddenException('Solo un administrador puede modificar tarifas de habitaciones.');
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
        oldValue: room,
        newValue: updatedRoom
      });
    }

    return updatedRoom;
  }

  async remove(number: string, dto: RemoveHabitacionDto, user: JwtPayload) {
    if (user.role !== Role.ADMIN) {
      throw new ForbiddenException('Solo un administrador puede eliminar habitaciones.');
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

    // Tampoco si tiene historial: la FK Stay.roomNumber lo impide y sin este
    // chequeo el borrado fallaria con un 500 de clave foranea.
    const staysCount = await this.prisma.stay.count({ where: { roomNumber: number } });
    if (staysCount > 0) {
      throw new ConflictException(
        `No se puede eliminar la habitación ${number} porque tiene ${staysCount} hospedaje(s) en su historial.`
      );
    }

    try {
      await this.prisma.room.delete({ where: { number } });
    } catch {
      throw new ConflictException(
        'No se pudo eliminar la habitación porque tiene registros relacionados.'
      );
    }

    // Registrar en auditoría
    await this.auditoria.log(user, {
      action: 'DELETE',
      entity: 'HABITACION',
      entityId: number,
      description: `Eliminó la habitación ${number} tipo ${room.type}`,
      oldValue: room
    });

    return { message: `Habitación ${number} eliminada.` };
  }

  private async requireAdminPassword(password?: string): Promise<void> {
    return assertAdminPassword(this.prisma, password);
  }
}
