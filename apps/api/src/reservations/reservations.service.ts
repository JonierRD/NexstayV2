import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { Prisma, ReservationPaymentType, ReservationStatus } from '@prisma/client';
import type { JwtPayload } from '../auth/auth.types';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { PrismaService } from '../prisma/prisma.service';
import { StaysService } from '../stays/stays.service';
import { CancelReservationDto, CreateReservationDto, UpdateReservationDto } from './dto/create-reservation.dto';

const includeReservation = {
  client: true,
  room: true,
  payments: { orderBy: { createdAt: 'asc' as const } },
  stay: true
};

function dateOnly(value: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new BadRequestException('La fecha debe tener formato AAAA-MM-DD.');
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new BadRequestException('La fecha indicada no es válida.');
  }
  return date;
}

function nightsBetween(checkIn: Date, checkOut: Date): number {
  return Math.round((checkOut.getTime() - checkIn.getTime()) / 86_400_000);
}

function overlapWhere(roomNumber: string, checkIn: Date, checkOut: Date) {
  return {
    roomNumber,
    checkIn: { lt: checkOut },
    checkOut: { gt: checkIn }
  };
}

@Injectable()
export class ReservationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditoriaService,
    private readonly stays: StaysService
  ) {}

  async findAll(status?: string) {
    const validStatuses = Object.values(ReservationStatus) as string[];
    if (status && !validStatuses.includes(status)) {
      throw new BadRequestException('El estado de reserva solicitado no es válido.');
    }
    return this.prisma.reservation.findMany({
      where: status ? { status: status as ReservationStatus } : {},
      include: includeReservation,
      orderBy: [{ checkIn: 'asc' }, { createdAt: 'desc' }]
    });
  }

  async availability(checkInValue: string, checkOutValue: string, excludeReservationId?: string) {
    const checkIn = dateOnly(checkInValue);
    const checkOut = dateOnly(checkOutValue);
    if (nightsBetween(checkIn, checkOut) < 1) {
      throw new BadRequestException('La salida debe ser posterior al ingreso.');
    }
    const excludeId = excludeReservationId === undefined ? undefined : Number(excludeReservationId);
    if (excludeId !== undefined && (!Number.isInteger(excludeId) || excludeId < 1)) {
      throw new BadRequestException('El identificador de reserva a excluir no es válido.');
    }

    const [rooms, reservations, stays] = await Promise.all([
      this.prisma.room.findMany({ select: { number: true, status: true } }),
      this.prisma.reservation.findMany({
        where: {
          status: ReservationStatus.CONFIRMADA,
          checkIn: { lt: checkOut },
          checkOut: { gt: checkIn },
          ...(excludeId !== undefined && { id: { not: excludeId } })
        },
        select: { roomNumber: true }
      }),
      this.prisma.stay.findMany({
        where: {
          status: 'ACTIVA', checkIn: { lt: checkOut },
          OR: [{ checkOut: null }, { checkOut: { gt: checkIn } }]
        },
        select: { roomNumber: true }
      })
    ]);
    const unavailable = new Set([
      ...reservations.map((reservation) => reservation.roomNumber),
      ...stays.map((stay) => stay.roomNumber),
      ...rooms.filter((room) => room.status === 'MANTENIMIENTO' || room.status === 'RESERVADA').map((room) => room.number)
    ]);
    return { unavailableRoomNumbers: [...unavailable] };
  }

  async findByCc(cc: string) {
    const client = await this.prisma.client.findUnique({ where: { cc } });
    if (!client) throw new NotFoundException('No existe un cliente con esa cédula.');
    return this.prisma.reservation.findMany({
      where: { clientId: client.id },
      include: includeReservation,
      orderBy: { checkIn: 'desc' }
    });
  }

  async create(dto: CreateReservationDto, user: JwtPayload) {
    if (!dto.paymentConfirmed) {
      throw new BadRequestException('Confirma que el pago completo fue recibido para confirmar la reserva.');
    }
    if (!dto.cancellationPolicyAccepted) {
      throw new BadRequestException('El cliente debe aceptar la política de cancelación antes de confirmar.');
    }
    const checkIn = dateOnly(dto.checkIn);
    const checkOut = dateOnly(dto.checkOut);
    const nights = nightsBetween(checkIn, checkOut);
    if (nights < 1) throw new BadRequestException('La salida debe ser posterior al ingreso.');

    const reservation = await this.prisma.$transaction(async (tx) => {
      const room = await tx.room.findUnique({ where: { number: dto.roomNumber } });
      if (!room) throw new NotFoundException(`La habitación ${dto.roomNumber} no existe.`);
      if (room.status === 'MANTENIMIENTO' || room.status === 'RESERVADA') {
        throw new ConflictException('La habitación está bloqueada o en mantenimiento.');
      }
      this.validateAcType(dto.acTypeUsed, room);
      await this.assertAvailable(tx, dto.roomNumber, checkIn, checkOut);

      const nightly = dto.acTypeUsed === 'AIRE' ? room.priceWithAir : room.priceWithFan;
      if (!nightly || Number(nightly) <= 0) {
        throw new BadRequestException('La habitación no tiene una tarifa válida para esa opción.');
      }
      const total = new Prisma.Decimal(nightly).mul(nights).toDecimalPlaces(0);
      const client = await tx.client.upsert({
        where: { cc: dto.cc.trim() },
        create: {
          cc: dto.cc.trim(), firstName: dto.firstName.trim(), lastName: dto.lastName.trim(),
          phone: dto.phone?.trim() || null,
          cityOrigin: dto.cityOrigin?.trim() || null,
          cityDestination: dto.cityDestination?.trim() || null,
          profession: dto.profession?.trim() || null,
          notes: dto.notes?.trim() || null
        },
        update: {
          firstName: dto.firstName.trim(), lastName: dto.lastName.trim(),
          phone: dto.phone?.trim() || null,
          cityOrigin: dto.cityOrigin?.trim() || null,
          cityDestination: dto.cityDestination?.trim() || null,
          profession: dto.profession?.trim() || null,
          notes: dto.notes?.trim() || null
        }
      });
      const created = await tx.reservation.create({
        data: {
          clientId: client.id, roomNumber: room.number, checkIn, checkOut, nights,
          pricePerNight: nightly, total, acTypeUsed: dto.acTypeUsed, createdById: user.sub,
          payments: {
            create: {
              userId: user.sub, type: ReservationPaymentType.PAGO, amount: total,
              method: dto.paymentMethod.trim(), reference: dto.paymentReference?.trim() || null,
              note: 'Pago completo recibido para confirmar la reserva. Política aceptada: devolución completa con más de 24 horas; dentro de las 24 horas se retiene el 20% del alojamiento.'
            }
          }
        },
        include: includeReservation
      });
      return created;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    await this.audit.log(user, {
      action: 'CREATE', entity: 'RESERVA', entityId: reservation.id.toString(),
      description: `Creó reserva ${reservation.id} para habitación ${reservation.roomNumber}; total ${reservation.total}.`,
      newValue: reservation
    });
    return reservation;
  }

  async update(id: number, dto: UpdateReservationDto, user: JwtPayload) {
    const before = await this.prisma.reservation.findUnique({ where: { id }, include: includeReservation });
    if (!before) throw new NotFoundException('Reserva no encontrada.');
    if (before.status !== ReservationStatus.CONFIRMADA) {
      throw new BadRequestException('Solo se pueden editar reservas confirmadas que aún no iniciaron check-in.');
    }

    const checkIn = dto.checkIn ? dateOnly(dto.checkIn) : before.checkIn;
    const checkOut = dto.checkOut ? dateOnly(dto.checkOut) : before.checkOut;
    const roomNumber = dto.roomNumber ?? before.roomNumber;
    const acTypeUsed = dto.acTypeUsed ?? before.acTypeUsed;
    const nights = nightsBetween(checkIn, checkOut);
    if (nights < 1) throw new BadRequestException('La salida debe ser posterior al ingreso.');

    const updated = await this.prisma.$transaction(async (tx) => {
      const room = await tx.room.findUnique({ where: { number: roomNumber } });
      if (!room) throw new NotFoundException(`La habitación ${roomNumber} no existe.`);
      if (room.status === 'MANTENIMIENTO' || room.status === 'RESERVADA') throw new ConflictException('La habitación está bloqueada o en mantenimiento.');
      this.validateAcType(acTypeUsed, room);
      await this.assertAvailable(tx, roomNumber, checkIn, checkOut, id);
      const nightly = acTypeUsed === 'AIRE' ? room.priceWithAir : room.priceWithFan;
      if (!nightly || Number(nightly) <= 0) throw new BadRequestException('La habitación no tiene una tarifa válida.');
      const total = new Prisma.Decimal(nightly).mul(nights).toDecimalPlaces(0);
      const paid = before.payments.reduce((sum, p) => sum + (p.type === ReservationPaymentType.PAGO ? Number(p.amount) : -Number(p.amount)), 0);
      const difference = Number(total) - paid;

      if (difference > 0) {
        if (!dto.additionalPaymentConfirmed || Number(dto.additionalPaymentAmount) !== difference || !dto.additionalPaymentMethod?.trim()) {
          throw new BadRequestException(`El nuevo total requiere registrar un pago adicional de ${difference}.`);
        }
        await tx.reservationPayment.create({ data: {
          reservationId: id, userId: user.sub, type: ReservationPaymentType.PAGO,
          amount: new Prisma.Decimal(difference), method: dto.additionalPaymentMethod.trim(),
          reference: dto.additionalPaymentReference?.trim() || null,
          note: 'Diferencia cobrada por modificación de la reserva.'
        } });
      } else if (difference < 0) {
        if (!dto.refundConfirmed || !dto.refundMethod?.trim()) {
          throw new BadRequestException(`Debe confirmarse la devolución de ${Math.abs(difference)} antes de guardar el cambio.`);
        }
        await tx.reservationPayment.create({ data: {
          reservationId: id, userId: user.sub, type: ReservationPaymentType.DEVOLUCION,
          amount: new Prisma.Decimal(Math.abs(difference)), method: dto.refundMethod.trim(),
          reference: dto.refundReference?.trim() || null,
          note: 'Devolución por reducción del total al modificar la reserva.'
        } });
      }

      if (dto.firstName || dto.lastName || dto.phone !== undefined || dto.cityOrigin !== undefined || dto.cityDestination !== undefined || dto.profession !== undefined || dto.notes !== undefined) {
        await tx.client.update({ where: { id: before.clientId }, data: {
          ...(dto.firstName !== undefined && { firstName: dto.firstName.trim() }),
          ...(dto.lastName !== undefined && { lastName: dto.lastName.trim() }),
          ...(dto.phone !== undefined && { phone: dto.phone.trim() || null }),
          ...(dto.cityOrigin !== undefined && { cityOrigin: dto.cityOrigin.trim() || null }),
          ...(dto.cityDestination !== undefined && { cityDestination: dto.cityDestination.trim() || null }),
          ...(dto.profession !== undefined && { profession: dto.profession.trim() || null }),
          ...(dto.notes !== undefined && { notes: dto.notes.trim() || null })
        } });
      }
      return tx.reservation.update({ where: { id }, data: {
        roomNumber, checkIn, checkOut, nights, pricePerNight: nightly, total, acTypeUsed
      }, include: includeReservation });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    await this.audit.log(user, {
      action: 'UPDATE', entity: 'RESERVA', entityId: id.toString(),
      description: `Actualizó reserva ${id}.`, oldValue: before, newValue: updated
    });
    return updated;
  }

  async cancel(id: number, dto: CancelReservationDto, user: JwtPayload) {
    const before = await this.prisma.reservation.findUnique({ where: { id }, include: includeReservation });
    if (!before) throw new NotFoundException('Reserva no encontrada.');
    if (before.status !== ReservationStatus.CONFIRMADA) {
      throw new BadRequestException('Solo se pueden cancelar reservas confirmadas.');
    }
    const force = dto.forceWaiver === true;
    if (force && (!dto.forceReason?.trim() || dto.confirmationText !== 'EXONERAR PENALIDAD')) {
      throw new BadRequestException('La exoneración requiere motivo y escribir EXONERAR PENALIDAD para confirmar.');
    }
    const cutoff = before.checkIn.getTime() - 24 * 60 * 60 * 1000;
    const late = Date.now() > cutoff;
    const payments = before.payments.reduce((sum, p) => sum + (p.type === ReservationPaymentType.PAGO ? Number(p.amount) : -Number(p.amount)), 0);
    const penalty = !force && late ? Math.round(Number(before.total) * 0.2) : 0;
    const refund = Math.max(0, payments - penalty);
    if (refund > 0 && (!dto.refundConfirmed || !dto.refundMethod?.trim())) {
      throw new BadRequestException(`Confirma la devolución de ${refund} e indica su método antes de cancelar la reserva.`);
    }

    const cancelled = await this.prisma.$transaction(async (tx) => {
      if (refund > 0) {
        await tx.reservationPayment.create({ data: {
          reservationId: id, userId: user.sub, type: ReservationPaymentType.DEVOLUCION,
          amount: new Prisma.Decimal(refund), method: dto.refundMethod!.trim(),
          reference: dto.refundReference?.trim() || null,
          note: force ? `Exoneración forzada: ${dto.forceReason!.trim()}` : late ? 'Devolución del 80%; penalidad del 20% por cancelación dentro de las 24 horas previas.' : 'Devolución total por cancelación con más de 24 horas de anticipación.'
        } });
      }
      const transitioned = await tx.reservation.updateMany({ where: { id, status: ReservationStatus.CONFIRMADA }, data: {
        status: ReservationStatus.CANCELADA,
        cancellationReason: force ? dto.forceReason!.trim() : late ? 'Cancelación dentro de las 24 horas previas al check-in.' : 'Cancelación con más de 24 horas de anticipación.',
        forceWaiver: force
      } });
      if (transitioned.count !== 1) {
        throw new ConflictException('La reserva ya cambió de estado. Actualiza la lista antes de volver a intentar.');
      }
      const result = await tx.reservation.findUniqueOrThrow({ where: { id }, include: includeReservation });
      await tx.auditLog.create({ data: {
        userId: user.sub, action: 'UPDATE', entity: 'RESERVA', entityId: id.toString(),
        description: force
          ? `Exoneración forzada al cancelar reserva ${id}. Motivo: ${dto.forceReason!.trim()}. Penalidad: $0; devolución registrada: ${refund}.`
          : `Canceló reserva ${id}. Penalidad: ${penalty}; devolución registrada: ${refund}.`,
        oldValue: JSON.stringify(before), newValue: JSON.stringify(result)
      } });
      return result;
    });
    return { reservation: cancelled, penalty, refund, forceWaiver: force };
  }

  async checkin(id: number, user: JwtPayload) {
    return this.stays.checkinFromReservation(id, user);
  }

  private validateAcType(acType: 'AIRE' | 'VENTILADOR', room: { hasAir: boolean; hasFan: boolean }) {
    if (acType === 'AIRE' && !room.hasAir) throw new BadRequestException('La habitación no tiene aire acondicionado.');
    if (acType === 'VENTILADOR' && !room.hasFan) throw new BadRequestException('La habitación no tiene ventilador.');
  }

  private async assertAvailable(tx: Prisma.TransactionClient, roomNumber: string, checkIn: Date, checkOut: Date, excludeId?: number) {
    const reservation = await tx.reservation.findFirst({ where: {
      ...overlapWhere(roomNumber, checkIn, checkOut),
      status: ReservationStatus.CONFIRMADA,
      ...(excludeId !== undefined && { id: { not: excludeId } })
    } });
    const stay = await tx.stay.findFirst({ where: {
      roomNumber, status: 'ACTIVA', checkIn: { lt: checkOut },
      OR: [{ checkOut: null }, { checkOut: { gt: checkIn } }]
    } });
    if (reservation || stay) throw new ConflictException('La habitación ya tiene una reserva u hospedaje que se cruza con esas fechas.');
  }
}
