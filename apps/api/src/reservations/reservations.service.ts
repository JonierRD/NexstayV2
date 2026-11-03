import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { Prisma, ReservationPaymentType, ReservationStatus } from '@prisma/client';
import type { JwtPayload } from '../auth/auth.types';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { FinanceService } from '../finance/finance.service';
import { PrismaService } from '../prisma/prisma.service';
import { StaysService } from '../stays/stays.service';
import { dateOnlyToUtc } from '../common/hotel-date';
import { syncRoomHold } from '../common/room-hold';
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
  const date = dateOnlyToUtc(value);
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
    checkIn: { lt: checkOut }
  };
}

@Injectable()
export class ReservationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditoriaService,
    private readonly stays: StaysService,
    private readonly finance: FinanceService
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
        where: { status: 'ACTIVA' },
        select: { roomNumber: true }
      })
    ]);
    const unavailable = new Set([
      ...reservations.map((reservation) => reservation.roomNumber),
      // Un huésped dentro no tiene fecha de salida cierta: la habitación queda
      // bloqueada para reservas hasta que se registre su check-out.
      ...stays.map((stay) => stay.roomNumber),
      ...rooms.filter((room) => room.status === 'MANTENIMIENTO').map((room) => room.number)
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
      throw new BadRequestException('Confirma que el anticipo fue recibido para confirmar la reserva.');
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
      if (room.status === 'MANTENIMIENTO') {
        throw new ConflictException('La habitación está en mantenimiento.');
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
          clientId: client.id, roomNumber: room.number, checkIn, checkOut, nights, isIndefinite: dto.isIndefinite ?? false,
          pricePerNight: nightly, total, acTypeUsed: dto.acTypeUsed, createdById: user.sub,
          payments: {
            create: {
              userId: user.sub, type: ReservationPaymentType.PAGO,
              amount: new Prisma.Decimal(Math.round(Number(total) / 2)),
              method: dto.paymentMethod.trim(), reference: dto.paymentReference?.trim() || null,
              note: 'Anticipo del 50% recibido para confirmar la reserva. El valor de devolución, si aplica, se define al cancelar.'
            }
          }
        },
        include: includeReservation
      });
      // Solo las reservas que ocupan hoy retienen la habitación. Las futuras
      // quedan agendadas sin bloquear el inventario antes de su llegada.
      await syncRoomHold(tx, room.number);
      return created;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    await this.audit.log(user, {
      action: 'CREATE', entity: 'RESERVA', entityId: reservation.id.toString(),
      description: `Creó reserva ${reservation.id} para habitación ${reservation.roomNumber}; total ${reservation.total}.`,
      newValue: reservation
    });
    // Anticipo de reserva queda registrado como ingreso en Ingresos y Gastos.
    await this.finance.registerAutomatic({
      type: 'INGRESO',
      category: 'Reservas',
      description: `Anticipo reserva ${reservation.id} habitación ${reservation.roomNumber}`,
      amount: Math.round(Number(reservation.total) / 2),
      notes: `Automático: anticipo del 50% al confirmar reserva`
    }, user);
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
    const isIndefinite = dto.isIndefinite ?? before.isIndefinite;
    const nights = nightsBetween(checkIn, checkOut);
    if (nights < 1) throw new BadRequestException('La salida debe ser posterior al ingreso.');

    const updated = await this.prisma.$transaction(async (tx) => {
      const room = await tx.room.findUnique({ where: { number: roomNumber } });
      if (!room) throw new NotFoundException(`La habitación ${roomNumber} no existe.`);
      if (room.status === 'MANTENIMIENTO') throw new ConflictException('La habitación está en mantenimiento.');
      this.validateAcType(acTypeUsed, room);
      await this.assertAvailable(tx, roomNumber, checkIn, checkOut, id);
      const nightly = acTypeUsed === 'AIRE' ? room.priceWithAir : room.priceWithFan;
      if (!nightly || Number(nightly) <= 0) throw new BadRequestException('La habitación no tiene una tarifa válida.');
      const total = new Prisma.Decimal(nightly).mul(nights).toDecimalPlaces(0);
      const paid = before.payments.reduce((sum, p) => sum + (p.type === ReservationPaymentType.PAGO ? Number(p.amount) : -Number(p.amount)), 0);
      const requiredAdvance = Math.round(Number(total) / 2);
      const advanceChanged = Number(total) !== Number(before.total) || isIndefinite !== before.isIndefinite;
      const difference = advanceChanged ? requiredAdvance - paid : 0;

      if (difference > 0) {
        if (!dto.additionalPaymentConfirmed || Number(dto.additionalPaymentAmount) !== difference || !dto.additionalPaymentMethod?.trim()) {
          throw new BadRequestException(`El nuevo anticipo requiere registrar un pago adicional de ${difference}.`);
        }
        await tx.reservationPayment.create({ data: {
          reservationId: id, userId: user.sub, type: ReservationPaymentType.PAGO,
          amount: new Prisma.Decimal(difference), method: dto.additionalPaymentMethod.trim(),
          reference: dto.additionalPaymentReference?.trim() || null,
          note: 'Diferencia cobrada por modificación de la reserva.'
        } });
      } else if (difference < 0) {
        const refundAmount = Number(dto.refundAmount ?? 0);
        if (!Number.isInteger(refundAmount) || refundAmount < 0 || refundAmount > Math.abs(difference)) {
          throw new BadRequestException('La devolucion debe ser un monto entero dentro del excedente pagado.');
        }
        if (refundAmount > 0) {
          if (!dto.refundConfirmed || !dto.refundMethod?.trim()) {
            throw new BadRequestException('Confirma la devolucion e indica su metodo antes de guardar.');
          }
          await tx.reservationPayment.create({ data: {
            reservationId: id, userId: user.sub, type: ReservationPaymentType.DEVOLUCION,
            amount: new Prisma.Decimal(refundAmount), method: dto.refundMethod.trim(),
            reference: dto.refundReference?.trim() || null,
            note: `Devolucion manual: ${paid > 0 ? (refundAmount / paid * 100).toFixed(1) : 0}% del pago neto.`
          } });
        }
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
      const updated = await tx.reservation.update({ where: { id }, data: {
        roomNumber, checkIn, checkOut, nights, pricePerNight: nightly, total, acTypeUsed, isIndefinite
      }, include: includeReservation });
      // Reconciliar la retención de la habitación anterior y la nueva.
      if (before.roomNumber !== roomNumber) {
        await syncRoomHold(tx, before.roomNumber);
      }
      await syncRoomHold(tx, roomNumber);
      return updated;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    await this.audit.log(user, {
      action: 'UPDATE', entity: 'RESERVA', entityId: id.toString(),
      description: `Actualizó reserva ${id}.`, oldValue: before, newValue: updated
    });
    const paidBefore = before.payments.reduce(
      (sum, payment) => sum + (payment.type === ReservationPaymentType.PAGO ? Number(payment.amount) : -Number(payment.amount)),
      0
    );
    const advanceDifference = Math.round(Number(updated.total) / 2) - paidBefore;
    if (advanceDifference > 0) {
      await this.finance.registerAutomatic({
        type: 'INGRESO', category: 'Reservas',
        description: `Anticipo adicional reserva ${id} habitacion ${updated.roomNumber}`,
        amount: advanceDifference,
        notes: 'Automatico: ajuste del anticipo al modificar reserva'
      }, user);
    } else if (advanceDifference < 0) {
      const refundAmount = Number(dto.refundAmount ?? 0);
      if (refundAmount > 0) {
        await this.finance.registerAutomatic({
          type: 'GASTO', category: 'Reservas',
          description: `Devolucion por modificacion reserva ${id} habitacion ${updated.roomNumber}`,
          amount: refundAmount,
          notes: `Automatico: devolucion manual, ${paidBefore > 0 ? (refundAmount / paidBefore * 100).toFixed(1) : 0}% del pago neto`
        }, user);
      }
    }
    return updated;
  }

  async cancel(id: number, dto: CancelReservationDto, user: JwtPayload) {
    const before = await this.prisma.reservation.findUnique({ where: { id }, include: includeReservation });
    if (!before) throw new NotFoundException('Reserva no encontrada.');
    if (before.status !== ReservationStatus.CONFIRMADA) {
      throw new BadRequestException('Solo se pueden cancelar reservas confirmadas.');
    }
    const payments = before.payments.reduce((sum, p) => sum + (p.type === ReservationPaymentType.PAGO ? Number(p.amount) : -Number(p.amount)), 0);
    const refund = Number(dto.refundAmount ?? 0);
    if (!Number.isInteger(refund) || refund < 0 || refund > payments) {
      throw new BadRequestException('La devolucion debe ser un monto entero dentro del anticipo pagado.');
    }
    const penalty = Math.max(0, payments - refund);
    if (refund > 0 && (!dto.refundConfirmed || !dto.refundMethod?.trim())) {
      throw new BadRequestException('Confirma la devolucion e indica su metodo antes de cancelar.');
    }

    const cancelled = await this.prisma.$transaction(async (tx) => {
      if (refund > 0) {
        await tx.reservationPayment.create({ data: {
          reservationId: id, userId: user.sub, type: ReservationPaymentType.DEVOLUCION,
          amount: new Prisma.Decimal(refund), method: dto.refundMethod!.trim(),
          reference: dto.refundReference?.trim() || null,
          note: `Devolucion manual: ${payments > 0 ? (refund / payments * 100).toFixed(1) : 0}% del anticipo.`
        } });
      }
      const transitioned = await tx.reservation.updateMany({ where: { id, status: ReservationStatus.CONFIRMADA }, data: {
        status: ReservationStatus.CANCELADA,
        cancellationReason: 'Cancelaci?n de reserva.',
        forceWaiver: false
      } });
      if (transitioned.count !== 1) {
        throw new ConflictException('La reserva ya cambió de estado. Actualiza la lista antes de volver a intentar.');
      }
      const result = await tx.reservation.findUniqueOrThrow({ where: { id }, include: includeReservation });
      // Si la reserva era la que retenía la habitación para hoy, liberarla.
      await syncRoomHold(tx, result.roomNumber);
      await tx.auditLog.create({ data: {
        userId: user.sub, action: 'UPDATE', entity: 'RESERVA', entityId: id.toString(),
        description: `Canceló reserva ${id}. Valor no devuelto: ${penalty}; devolución registrada: ${refund}.`,
        oldValue: JSON.stringify(before), newValue: JSON.stringify(result)
      } });
      return result;
    });
    if (refund > 0) {
      await this.finance.registerAutomatic({
        type: 'GASTO',
        category: 'Reservas',
        description: `Devolución por cancelación reserva ${id} habitación ${cancelled.roomNumber}`,
        amount: refund,
        notes: `Devolucion manual: ${payments > 0 ? (refund / payments * 100).toFixed(1) : 0}% del anticipo.`,
      }, user);
    }
    return { reservation: cancelled, penalty, refund };
  }

  async checkin(id: number, user: JwtPayload) {
    return this.stays.checkinFromReservation(id, user);
  }

  async remove(id: number, user: JwtPayload) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id },
      include: { payments: true }
    });
    if (!reservation) throw new NotFoundException('Reserva no encontrada.');
    if (reservation.status !== ReservationStatus.CANCELADA) {
      throw new BadRequestException('Solo se pueden eliminar permanentemente reservas canceladas.');
    }
    await this.prisma.$transaction(async (tx) => {
      await tx.reservationPayment.deleteMany({ where: { reservationId: id } });
      await tx.reservation.delete({ where: { id } });
      await tx.auditLog.create({
        data: {
          userId: user.sub,
          action: 'DELETE',
          entity: 'RESERVA',
          entityId: id.toString(),
          description: `Eliminó permanentemente la reserva cancelada # (habitación ).`,
          oldValue: JSON.stringify(reservation)
        }
      });
    });
    return { success: true };
  }

  private validateAcType(acType: 'AIRE' | 'VENTILADOR', room: { hasAir: boolean; hasFan: boolean }) {
    if (acType === 'AIRE' && !room.hasAir) throw new BadRequestException('La habitación no tiene aire acondicionado.');
    if (acType === 'VENTILADOR' && !room.hasFan) throw new BadRequestException('La habitación no tiene ventilador.');
  }

  private async assertAvailable(tx: Prisma.TransactionClient, roomNumber: string, checkIn: Date, checkOut: Date, excludeId?: number) {
    const reservation = await tx.reservation.findFirst({ where: {
      ...overlapWhere(roomNumber, checkIn, checkOut),
      checkOut: { gt: checkIn },
      status: ReservationStatus.CONFIRMADA,
      ...(excludeId !== undefined && { id: { not: excludeId } })
    } });
    const stays = await tx.stay.findMany({
      where: { roomNumber, status: 'ACTIVA' },
      select: { id: true }
    });
    if (reservation || stays.length > 0) throw new ConflictException(
      stays.length > 0
        ? 'La habitación está ocupada por un huésped. Registra primero su salida para poder reservarla.'
        : 'La habitación ya tiene una reserva que se cruza con esas fechas.'
    );
  }

}
