import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { JwtPayload } from '../auth/auth.types';
import type { CheckinDto } from './dto/checkin.dto';
import type { UpdateStayDto } from './dto/update-stay.dto';
import type { CheckoutDto } from './dto/checkout.dto';
import { AuditoriaService, AuditAction } from '../auditoria/auditoria.service';

@Injectable()
export class StaysService {
  constructor(
    private prisma: PrismaService,
    private auditoria: AuditoriaService
  ) {}

  async findAll() {
    return this.prisma.stay.findMany({
      include: {
        client: true,
        room: true,
        sales: { include: { product: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findActive() {
    const stays = await this.prisma.stay.findMany({
      where: { status: 'ACTIVA' },
      include: {
        client: true,
        room: true,
        reservation: { include: { payments: true } },
        // Sin esto el huesped aparece siempre sin consumos.
        sales: { include: { product: true }, orderBy: { date: 'asc' } }
      },
      orderBy: { checkIn: 'desc' }
    });

    const staysWithLaundry = await Promise.all(
      stays.map(async (stay) => {
        const laundry = await this.prisma.laundry.findMany({
          where: {
            roomNumber: stay.roomNumber,
            createdAt: { gte: stay.checkIn }
          },
          orderBy: { createdAt: 'asc' }
        });
        return {
          ...stay,
          laundry
        };
      })
    );

    return staysWithLaundry;
  }

  async findOne(id: number) {
    const stay = await this.prisma.stay.findUnique({
      where: { id },
      include: {
        client: true,
        room: true,
        reservation: { include: { payments: true } },
        sales: {
          include: {
            product: true
          }
        }
      }
    });

    if (!stay) {
      throw new NotFoundException('Hospedaje no encontrado');
    }

    return stay;
  }

  async findByRoom(roomNumber: string) {
    return this.prisma.stay.findMany({
      where: { roomNumber },
      include: {
        client: true,
        room: true,
        // Necesario para calcular la deuda de tienda de la habitacion.
        sales: { include: { product: true }, orderBy: { date: 'asc' } }
      },
      orderBy: { checkIn: 'desc' }
    });
  }

  async findByClient(cc: string) {
    const client = await this.prisma.client.findUnique({
      where: { cc },
      include: {
        stays: {
          include: {
            room: true
          },
          orderBy: { checkIn: 'desc' }
        }
      }
    });

    if (!client) {
      throw new NotFoundException('Cliente no encontrado');
    }

    return client;
  }

  async checkinFromReservation(reservationId: number, user: JwtPayload) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id: reservationId }, include: { client: true }
    });
    if (!reservation) throw new NotFoundException('Reserva no encontrada.');
    if (reservation.status !== 'CONFIRMADA') throw new BadRequestException('La reserva ya no está confirmada.');
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit'
    }).formatToParts(new Date());
    const today = `${parts.find((part) => part.type === 'year')?.value}-${parts.find((part) => part.type === 'month')?.value}-${parts.find((part) => part.type === 'day')?.value}`;
    if (reservation.checkIn.toISOString().slice(0, 10) !== today) {
      throw new BadRequestException('El check-in de la reserva solo se puede realizar en la fecha de llegada.');
    }
    return this.checkin({
      cc: reservation.client.cc,
      firstName: reservation.client.firstName,
      lastName: reservation.client.lastName,
      phone: reservation.client.phone ?? undefined,
      cityOrigin: reservation.client.cityOrigin ?? undefined,
      cityDestination: reservation.client.cityDestination ?? undefined,
      profession: reservation.client.profession ?? undefined,
      notes: reservation.client.notes ?? undefined,
      roomNumber: reservation.roomNumber,
      acType: reservation.acTypeUsed,
      nights: reservation.nights,
      checkIn: new Date().toISOString(),
      reservationId
    }, user);
  }

  async checkin(dto: CheckinDto, user: JwtPayload) {
    const nights = dto.nights || 1;

    // Todo el registro del hospedaje ocurre en una única transacción para que dos
    // check-ins simultaneos sobre la misma habitacion no puedan aceptarse ambos.
    const { stay, client, clientCreated } = await this.prisma.$transaction(
      async (tx) => {
        const linkedReservation = dto.reservationId
          ? await tx.reservation.findUnique({ where: { id: dto.reservationId } })
          : null;
        if (dto.reservationId && (!linkedReservation || linkedReservation.status !== 'CONFIRMADA')) {
          throw new BadRequestException('La reserva no existe o ya no está confirmada.');
        }
        // 1. Buscar cliente por cédula
        let client = await tx.client.findUnique({
          where: { cc: dto.cc }
        });
        const clientCreated = !client;

        // 2. Si no existe, crearlo
        if (!client) {
          if (!dto.firstName || !dto.lastName) {
            throw new BadRequestException(
              'Para un nuevo cliente se requiere nombre y apellido'
            );
          }

          client = await tx.client.create({
            data: {
              cc: dto.cc,
              firstName: dto.firstName,
              lastName: dto.lastName,
              phone: dto.phone,
              cityOrigin: dto.cityOrigin,
              cityDestination: dto.cityDestination,
              profession: dto.profession,
              notes: dto.notes
            }
          });
        }

        // 3. Validar habitación
        const room = await tx.room.findUnique({
          where: { number: dto.roomNumber }
        });

        if (!room) {
          throw new NotFoundException(`La habitación ${dto.roomNumber} no existe`);
        }

        if (room.status !== 'DISPONIBLE') {
          throw new BadRequestException(
            `La habitación ${dto.roomNumber} no está disponible. Estado actual: ${room.status}`
          );
        }
        if (linkedReservation && (linkedReservation.clientId !== client.id ||
          linkedReservation.roomNumber !== dto.roomNumber ||
          linkedReservation.acTypeUsed !== dto.acType || linkedReservation.nights !== nights)) {
          throw new BadRequestException('Los datos del check-in no coinciden con la reserva confirmada.');
        }

        // 4. Validar A/C
        if (dto.acType === 'AIRE' && !room.hasAir) {
          throw new BadRequestException('La habitación no tiene aire acondicionado');
        }
        if (dto.acType === 'VENTILADOR' && !room.hasFan) {
          throw new BadRequestException('La habitación no tiene ventilador');
        }

        // 5. Calcular precio según A/C
        const currentRoomPrice = dto.acType === 'AIRE' ? room.priceWithAir : room.priceWithFan;
        const pricePerNight = linkedReservation?.pricePerNight ?? currentRoomPrice;

        if (!pricePerNight || Number(pricePerNight) <= 0) {
          throw new BadRequestException(
            `No hay precio configurado para ${dto.acType} en esta habitación`
          );
        }

        const total = linkedReservation?.total ?? Number(pricePerNight) * nights;
        const requestedCheckIn = dto.checkIn ? new Date(dto.checkIn) : new Date();
        const requestedCheckOut = new Date(requestedCheckIn.getTime() + nights * 24 * 60 * 60 * 1000);
        const conflictingReservation = await tx.reservation.findFirst({
          where: {
            roomNumber: dto.roomNumber,
            status: 'CONFIRMADA',
            checkIn: { lt: requestedCheckOut },
            checkOut: { gt: requestedCheckIn },
            ...(dto.reservationId !== undefined && { id: { not: dto.reservationId } })
          }
        });
        if (conflictingReservation) {
          throw new ConflictException(`La habitación ${dto.roomNumber} está reservada durante parte de esas fechas.`);
        }

        // 6. Reclamar la habitación con compare-and-set: el filtro status
        // DISPONIBLE hace que solo una de las transacciones concurrentes gane.
        const claimed = await tx.room.updateMany({
          where: { number: dto.roomNumber, status: 'DISPONIBLE' },
          data: { status: 'OCUPADA' }
        });

        if (claimed.count === 0) {
          throw new ConflictException(
            `La habitación ${dto.roomNumber} fue ocupada por otra operación. Intenta de nuevo.`
          );
        }

        // 7. Crear Stay
        const stay = await tx.stay.create({
          data: {
            clientId: client.id,
            roomNumber: dto.roomNumber,
            checkIn: requestedCheckIn,
            nights,
            pricePerNight,
            total,
            acTypeUsed: dto.acType,
            status: 'ACTIVA',
            reservationId: dto.reservationId
          },
          include: {
            client: true,
            room: true
          }
        });

        if (dto.reservationId) {
          await tx.reservation.update({ where: { id: dto.reservationId }, data: { status: 'CHECKED_IN' } });
        }

        return { stay, client, clientCreated };
      }
    );

    // 8. Auditorías fuera de la transacción para no abortar el check-in por un log.
    if (clientCreated) {
      await this.auditoria.log(user, {
        action: 'CREATE',
        entity: 'CLIENTE',
        entityId: client.id.toString(),
        description: `Creó cliente: ${client.firstName} ${client.lastName} (CC: ${client.cc})`,
        newValue: client
      });
    }

    await this.auditoria.log(user, {
      action: 'CHECK_IN',
      entity: 'STAY',
      entityId: stay.id.toString(),
      description: `Check-in: ${client.firstName} ${client.lastName} en habitación ${dto.roomNumber} (${dto.acType}, ${nights} noches)`,
      newValue: stay
    });

    if (dto.reservationId) {
      await this.auditoria.log(user, {
        action: 'CHECK_IN', entity: 'RESERVA', entityId: dto.reservationId.toString(),
        description: `La reserva ${dto.reservationId} se convirtió en el hospedaje ${stay.id}.`,
        newValue: { reservationId: dto.reservationId, stayId: stay.id, status: 'CHECKED_IN' }
      });
    }

    return stay;
  }

  async checkout(id: number, user: JwtPayload, dto: CheckoutDto = {}) {
    // 1. Buscar el stay
    const stay = await this.prisma.stay.findUnique({
      where: { id },
      include: {
        client: true,
        room: true,
        reservation: { include: { payments: true } },
        sales: {
          include: {
            product: true
          }
        }
      }
    });

    if (!stay) {
      throw new NotFoundException('Hospedaje no encontrado');
    }

    if (stay.status !== 'ACTIVA') {
      throw new BadRequestException(
        `El hospedaje ya está ${stay.status.toLowerCase()}`
      );
    }

    // 3. Calcular noches a cobrar y totales
    // Por defecto se liquidan las noches pactadas al ingresar (stay.nights).
    // Si recepción autorizó una extensión explícita, se usa dto.nights.
    const checkOut = new Date();
    const nightsToBill = dto?.nights && dto.nights > 0 ? dto.nights : stay.nights;
    const totalRoom = Number(stay.pricePerNight) * nightsToBill;
    
    // Calcular total de ventas (tienda) - Solo las que quedaron a la cuenta (FIADO o sin tipo)
    const pendingSales = stay.sales.filter((sale) => sale.saleType === 'FIADO' || !sale.saleType);
    const totalSales = pendingSales.reduce((sum, sale) => {
      return sum + (Number(sale.unitPrice) * sale.quantity);
    }, 0);

    // Buscar órdenes de lavandería de esta habitación durante la estancia
    const laundryOrders = await this.prisma.laundry.findMany({
      where: {
        roomNumber: stay.roomNumber,
        createdAt: { gte: stay.checkIn }
      }
    });
    const totalLaundry = laundryOrders.reduce((sum, item) => sum + Number(item.totalPrice), 0);

    const reservationPaid = stay.reservation?.payments.reduce(
      (sum, payment) => sum + (payment.type === 'PAGO' ? Number(payment.amount) : -Number(payment.amount)),
      0
    ) ?? 0;
    const roomBalance = Math.max(0, totalRoom - reservationPaid);
    const grandTotal = roomBalance + totalSales + totalLaundry;

    if (grandTotal > 0 && (!dto.paymentConfirmed || !dto.paymentMethod?.trim())) {
      throw new BadRequestException(`Registra y confirma el pago final de ${Math.round(grandTotal)} antes de completar el check-out.`);
    }

    const updatedStay = await this.prisma.$transaction(async (tx) => {
      const transitioned = await tx.stay.updateMany({
        where: { id, status: 'ACTIVA' },
        data: { checkOut, nights: nightsToBill, total: grandTotal, status: 'FINALIZADA' }
      });
      if (transitioned.count !== 1) throw new ConflictException('El hospedaje ya fue cerrado por otra operación. Actualiza la pantalla.');

      if (grandTotal > 0) {
        await tx.stayPayment.create({ data: {
          stayId: id, userId: user.sub, amount: new Prisma.Decimal(grandTotal),
          method: dto.paymentMethod!.trim(), reference: dto.paymentReference?.trim() || null
        } });
      }
      await tx.room.update({ where: { number: stay.roomNumber }, data: { status: 'DISPONIBLE' } });
      return tx.stay.findUniqueOrThrow({
        where: { id }, include: { client: true, room: true, payments: true, reservation: true }
      });
    });

    // 6. Auditoría del check-out con desglose completo
    await this.auditoria.log(user, {
      action: 'CHECK_OUT',
      entity: 'STAY',
      entityId: stay.id.toString(),
      description: `Check-out: ${stay.client.firstName} ${stay.client.lastName} de habitación ${stay.roomNumber} (${nightsToBill} noches: $${Math.round(totalRoom).toLocaleString('es-CO')}, anticipo aplicado: $${Math.round(Math.min(totalRoom, reservationPaid)).toLocaleString('es-CO')}, saldo de hospedaje: $${Math.round(roomBalance).toLocaleString('es-CO')}, tienda pendiente: $${Math.round(totalSales).toLocaleString('es-CO')}, lavandería: $${Math.round(totalLaundry).toLocaleString('es-CO')}, pago final registrado: $${Math.round(grandTotal).toLocaleString('es-CO')})`,
      oldValue: stay,
      newValue: updatedStay
    });

    return updatedStay;
  }

  async update(id: number, dto: UpdateStayDto, user: JwtPayload) {
    // 1. Buscar el stay
    const stay = await this.prisma.stay.findUnique({
      where: { id },
      include: {
        client: true,
        room: true
      }
    });

    if (!stay) {
      throw new NotFoundException('Hospedaje no encontrado');
    }

    if (stay.status !== 'ACTIVA') {
      throw new BadRequestException(
        'Solo se pueden modificar hospedajes activos'
      );
    }

    // 3. Preparar datos de actualización
    const updateData: Prisma.StayUncheckedUpdateInput = {};

    if (dto.nights !== undefined) {
      updateData.nights = dto.nights;
      updateData.total = Number(stay.pricePerNight) * dto.nights;
    }

    if (dto.acTypeUsed !== undefined) {
      // Validar que la habitación tenga el A/C solicitado
      if (dto.acTypeUsed === 'AIRE' && !stay.room.hasAir) {
        throw new BadRequestException('La habitación no tiene aire acondicionado');
      }
      if (dto.acTypeUsed === 'VENTILADOR' && !stay.room.hasFan) {
        throw new BadRequestException('La habitación no tiene ventilador');
      }

      // Actualizar precio
      const newPricePerNight = dto.acTypeUsed === 'AIRE' 
        ? stay.room.priceWithAir 
        : stay.room.priceWithFan;

      if (!newPricePerNight || Number(newPricePerNight) <= 0) {
        throw new BadRequestException(
          `No hay precio configurado para ${dto.acTypeUsed}`
        );
      }

      updateData.acTypeUsed = dto.acTypeUsed;
      updateData.pricePerNight = newPricePerNight;
      updateData.total = Number(newPricePerNight) * (dto.nights || stay.nights);
    }

    // 4. Actualizar
    const updatedStay = await this.prisma.stay.update({
      where: { id },
      data: updateData,
      include: {
        client: true,
        room: true
      }
    });

    // 5. Auditoría
    const changes: string[] = [];
    if (dto.nights !== undefined && dto.nights !== stay.nights) {
      changes.push(`noches de ${stay.nights} a ${dto.nights}`);
    }
    if (dto.acTypeUsed !== undefined && dto.acTypeUsed !== stay.acTypeUsed) {
      changes.push(`A/C de ${stay.acTypeUsed} a ${dto.acTypeUsed}`);
    }

    if (changes.length > 0) {
      await this.auditoria.log(user, {
        action: 'UPDATE',
        entity: 'STAY',
        entityId: id.toString(),
        description: `Actualizó hospedaje ID ${id}: ${changes.join(', ')}`,
        oldValue: stay,
        newValue: updatedStay
      });
    }

    return updatedStay;
  }

  async cancel(id: number, user: JwtPayload) {
    // 1. Buscar el stay
    const stay = await this.prisma.stay.findUnique({
      where: { id },
      include: {
        client: true,
        room: true
      }
    });

    if (!stay) {
      throw new NotFoundException('Hospedaje no encontrado');
    }

    if (stay.status !== 'ACTIVA') {
      throw new BadRequestException(
        'Solo se pueden cancelar hospedajes activos'
      );
    }

    // 3. Actualizar a CANCELADA
    const updatedStay = await this.prisma.stay.update({
      where: { id },
      data: { status: 'CANCELADA' },
      include: {
        client: true,
        room: true
      }
    });

    // 4. Actualizar habitación a DISPONIBLE
    await this.prisma.room.update({
      where: { number: stay.roomNumber },
      data: { status: 'DISPONIBLE' }
    });

    // 5. Auditoría
    await this.auditoria.log(user, {
      action: 'UPDATE',
      entity: 'STAY',
      entityId: id.toString(),
      description: `Canceló hospedaje: ${stay.client.firstName} ${stay.client.lastName} en habitación ${stay.roomNumber}`,
      oldValue: stay,
      newValue: updatedStay
    });

    return updatedStay;
  }
}
