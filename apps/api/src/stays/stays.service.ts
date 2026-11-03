import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { Prisma, RoomStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { JwtPayload } from '../auth/auth.types';
import type { CheckinDto } from './dto/checkin.dto';
import type { UpdateStayDto } from './dto/update-stay.dto';
import type { CheckoutDto } from './dto/checkout.dto';
import { AuditoriaService, AuditAction } from '../auditoria/auditoria.service';
import { FinanceService } from '../finance/finance.service';
import type { RegisterStayPaymentDto } from './dto/register-payment.dto';
import { calculateStayCharge } from './stay-nights';
import { assertAdminPassword } from '../auth/admin-password';
import { SettingsService } from '../settings/settings.service';
import { bogotaDateOnly, dateOnlyToUtc, todayDateOnly } from '../common/hotel-date';
import { releaseRoomToAvailability } from '../common/room-hold';

type PendingSale = { unitPrice: Prisma.Decimal | number; quantity: number; saleType?: string | null };

export type StayAccount = {
  roomTotal: number;
  salesTotal: number;
  laundryTotal: number;
  reservationCredit: number;
  priorPayments: number;
  chargesTotal: number;
  paidTotal: number;
  balance: number;
};

/**
 * Cuenta de un hospedaje: cargos (hospedaje + tienda fiada + lavanderia) menos
 * lo ya pagado (credito de la reserva + pagos parciales registrados).
 */
function computeStayAccount(
  stay: {
    pricePerNight: Prisma.Decimal | number;
    nights: number;
    sales?: PendingSale[];
    reservation?: { payments?: Array<{ type: string; amount: Prisma.Decimal | number }> } | null;
    payments?: Array<{ amount: Prisma.Decimal | number }>;
  },
  laundryOrders: Array<{ totalPrice: Prisma.Decimal | number }>,
  nightsOverride?: number,
  roomTotalOverride?: number
): StayAccount {
  const roomTotal = roomTotalOverride ?? Number(stay.pricePerNight) * (nightsOverride ?? stay.nights);
  const salesTotal = (stay.sales ?? [])
    .filter((sale) => sale.saleType === 'FIADO' || !sale.saleType)
    .reduce((sum, sale) => sum + Number(sale.unitPrice) * sale.quantity, 0);
  const laundryTotal = laundryOrders.reduce((sum, item) => sum + Number(item.totalPrice), 0);
  const reservationPaid = (stay.reservation?.payments ?? []).reduce(
    (sum, payment) => sum + (payment.type === 'PAGO' ? Number(payment.amount) : -Number(payment.amount)),
    0
  );
  const reservationCredit = Math.min(roomTotal, Math.max(0, reservationPaid));
  const priorPayments = (stay.payments ?? []).reduce((sum, payment) => sum + Number(payment.amount), 0);
  const chargesTotal = roomTotal + salesTotal + laundryTotal;
  const paidTotal = reservationCredit + priorPayments;
  const balance = Math.max(0, chargesTotal - paidTotal);

  return {
    roomTotal,
    salesTotal,
    laundryTotal,
    reservationCredit,
    priorPayments,
    chargesTotal,
    paidTotal,
    balance
  };
}

@Injectable()
export class StaysService {
  constructor(
    private prisma: PrismaService,
    private auditoria: AuditoriaService,
    private finance: FinanceService,
    private settings: SettingsService
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
        sales: { include: { product: true }, orderBy: { date: 'asc' } },
        payments: { orderBy: { createdAt: 'asc' } }
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

    const policy = await this.settings.get();
    const tolerance = policy.checkoutTolerance;

    return staysWithLaundry.map((stay) => {
      const charge = calculateStayCharge(
        stay.checkIn,
        new Date(),
        Number(stay.pricePerNight),
        tolerance,
        policy.checkoutOvertimeRate,
        policy.checkoutLimit
      );
      return {
        ...stay,
        nights: charge.nights,
        overtimeAmount: charge.overtimeAmount,
        checkoutToleranceMinutes: tolerance,
        checkoutOvertimeRate: policy.checkoutOvertimeRate,
        total: charge.total - charge.overtimeAmount
      };
    });
  }

  async findHistory(limit = 50) {
    const stays = await this.prisma.stay.findMany({
      where: { status: { in: ['FINALIZADA', 'CANCELADA'] } },
      include: {
        client: true,
        room: true,
        reservation: { include: { payments: true } },
        sales: { include: { product: true }, orderBy: { date: 'asc' } },
        payments: { orderBy: { createdAt: 'asc' } }
      },
      orderBy: { checkOut: 'desc' },
      take: Math.min(Math.max(limit, 1), 200)
    });

    return Promise.all(stays.map(async (stay) => ({
      ...stay,
      laundry: await this.prisma.laundry.findMany({
        where: { roomNumber: stay.roomNumber, createdAt: { gte: stay.checkIn, ...(stay.checkOut ? { lte: stay.checkOut } : {}) } },
        orderBy: { createdAt: 'asc' }
      })
    })));
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
        },
        payments: { orderBy: { createdAt: 'asc' } }
      }
    });

    if (!stay) {
      throw new NotFoundException('Hospedaje no encontrado');
    }

    if (stay.status !== 'ACTIVA') return stay;
    const policy = await this.settings.get();
    const tolerance = policy.checkoutTolerance;
    const charge = calculateStayCharge(
      stay.checkIn,
      new Date(),
      Number(stay.pricePerNight),
      tolerance,
      policy.checkoutOvertimeRate,
      policy.checkoutLimit
    );
    return {
      ...stay,
      nights: charge.nights,
      overtimeAmount: charge.overtimeAmount,
      checkoutToleranceMinutes: tolerance,
      checkoutOvertimeRate: policy.checkoutOvertimeRate,
      total: charge.total - charge.overtimeAmount
    };
  }

  async findByRoom(roomNumber: string) {
    return this.prisma.stay.findMany({
      where: { roomNumber },
      include: {
        client: true,
        room: true,
        // Necesario para calcular la deuda de tienda de la habitacion.
        sales: { include: { product: true }, orderBy: { date: 'asc' } },
        payments: { orderBy: { createdAt: 'asc' } }
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
    const today = bogotaDateOnly(new Date());
    // Se permite el ingreso el día de llegada o después (llegadas tardías);
    // nunca antes de la fecha reservada.
    if (reservation.checkIn.toISOString().slice(0, 10) > today) {
      throw new BadRequestException('El check-in de la reserva solo se puede realizar a partir de la fecha de llegada.');
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

        // Una reserva puede tener la habitación retenida como RESERVADA; el
        // check-in vinculado sí puede tomarla. Un ingreso sin reserva exige
        // que esté DISPONIBLE, salvo que la retención sea obsoleta (reserva
        // de hoy que nunca llegó o cuya fecha ya pasó).
        let claimableStatuses: RoomStatus[] = linkedReservation
          ? [RoomStatus.DISPONIBLE, RoomStatus.RESERVADA]
          : [RoomStatus.DISPONIBLE];
        if (!linkedReservation && room.status === RoomStatus.RESERVADA) {
          const today = dateOnlyToUtc(todayDateOnly());
          const currentHold = await tx.reservation.findFirst({
            where: {
              roomNumber: dto.roomNumber,
              status: 'CONFIRMADA',
              checkIn: { lte: today },
              checkOut: { gt: today }
            },
            select: { id: true }
          });
          if (!currentHold) {
            claimableStatuses = [RoomStatus.DISPONIBLE, RoomStatus.RESERVADA];
          }
        }
        if (room.status === 'MANTENIMIENTO' || !claimableStatuses.includes(room.status)) {
          throw new BadRequestException(
            `La habitación ${dto.roomNumber} no está disponible. Estado actual: ${room.status}`
          );
        }
        if (linkedReservation && (linkedReservation.clientId !== client.id ||
          linkedReservation.roomNumber !== dto.roomNumber ||
          linkedReservation.acTypeUsed !== dto.acType)) {
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

        const requestedCheckIn = dto.checkIn ? new Date(dto.checkIn) : new Date();
        if (Number.isNaN(requestedCheckIn.getTime())) {
          throw new BadRequestException('La fecha de ingreso no es válida.');
        }
        // Un ingreso no puede adelantarse: si la llegada es futura debe
        // registrarse como reserva para no ocupar la habitación desde hoy.
        if (bogotaDateOnly(requestedCheckIn) > bogotaDateOnly(new Date())) {
          throw new BadRequestException('No se puede registrar un ingreso con fecha futura. Para fechas posteriores, crea una reserva.');
        }
        const stayNights = Math.max(1, linkedReservation?.nights ?? dto.nights ?? 1);
        const total = Number(pricePerNight) * stayNights;
        // Una reserva futura no impide el ingreso: la salida del huésped no se
        // conoce. El recepcionista ve el aviso de la reserva y le indica que
        // debe desocupar antes de esa fecha.

        // 6. Reclamar la habitación con compare-and-set: el filtro de estados
        // hace que solo una de las transacciones concurrentes gane.
        const claimed = await tx.room.updateMany({
          where: { number: dto.roomNumber, status: { in: claimableStatuses } },
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
            nights: stayNights,
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
      description: `Check-in: ${client.firstName} ${client.lastName} en habitación ${dto.roomNumber} (${dto.acType}, ${stay.nights} noches)`,
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
        },
        payments: { orderBy: { createdAt: 'asc' } }
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

    // 3. Calcular noches a cobrar y totales según la hora de salida del hotel.
    const checkOut = new Date();
    const policy = await this.settings.get();
    const tolerance = policy.checkoutTolerance;
    const stayCharge = calculateStayCharge(
      stay.checkIn,
      checkOut,
      Number(stay.pricePerNight),
      tolerance,
      policy.checkoutOvertimeRate,
      policy.checkoutLimit
    );
    const nightsToBill = stayCharge.nights;
    const overtimeAmount = dto.chargeOvertime ? stayCharge.overtimeAmount : 0;
    const totalRoom = (nightsToBill * Number(stay.pricePerNight)) + overtimeAmount;
    
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
    const reservationCredit = Math.min(totalRoom, Math.max(0, reservationPaid));
    const roomBalance = Math.max(0, totalRoom - reservationCredit);

    // Pagos parciales ya registrados durante la estadía (pagar sin salir).
    const priorPayments = stay.payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
    const accountTotal = roomBalance + totalSales + totalLaundry;
    const balanceDue = Math.max(0, accountTotal - priorPayments);

    if (balanceDue > 0 && (!dto.paymentConfirmed || !dto.paymentMethod?.trim())) {
      throw new BadRequestException(`Registra y confirma el pago final de ${Math.round(balanceDue)} antes de completar el check-out.`);
    }

    const updatedStay = await this.prisma.$transaction(async (tx) => {
      const transitioned = await tx.stay.updateMany({
        where: { id, status: 'ACTIVA' },
        data: { checkOut, nights: nightsToBill, total: accountTotal, status: 'FINALIZADA' }
      });
      if (transitioned.count !== 1) throw new ConflictException('El hospedaje ya fue cerrado por otra operación. Actualiza la pantalla.');

      if (balanceDue > 0) {
        await tx.stayPayment.create({ data: {
          stayId: id, userId: user.sub, amount: new Prisma.Decimal(balanceDue),
          method: dto.paymentMethod!.trim(), reference: dto.paymentReference?.trim() || null
        } });
      }
      await releaseRoomToAvailability(tx, stay.roomNumber);
      await tx.parkingSession.updateMany({
        where: { stayId: id, status: 'ACTIVO' },
        data: { status: 'CERRADO', exitAt: checkOut }
      });
      return tx.stay.findUniqueOrThrow({
        where: { id }, include: { client: true, room: true, payments: true, reservation: true }
      });
    });

    // 6. Auditoría del check-out con desglose completo
    await this.auditoria.log(user, {
      action: 'CHECK_OUT',
      entity: 'STAY',
      entityId: stay.id.toString(),
      description: `Check-out: ${stay.client.firstName} ${stay.client.lastName} de habitación ${stay.roomNumber} (${nightsToBill} noches: $${Math.round(totalRoom).toLocaleString('es-CO')}, anticipo aplicado: $${Math.round(reservationCredit).toLocaleString('es-CO')}, pagos previos: $${Math.round(priorPayments).toLocaleString('es-CO')}, saldo de hospedaje: $${Math.round(roomBalance).toLocaleString('es-CO')}, tienda pendiente: $${Math.round(totalSales).toLocaleString('es-CO')}, lavandería: $${Math.round(totalLaundry).toLocaleString('es-CO')}, pago final registrado: $${Math.round(balanceDue).toLocaleString('es-CO')})`,
      oldValue: stay,
      newValue: updatedStay
    });

    // Ingreso automático en Ingresos y Gastos por el pago final del check-out.
    if (balanceDue > 0) {
      await this.finance.registerAutomatic({
        type: 'INGRESO',
        category: 'Hospedaje',
        description: `Check-out habitación ${stay.roomNumber} (${stay.client.firstName} ${stay.client.lastName})`,
        amount: balanceDue,
        notes: `Automático: pago final hospedaje ID ${stay.id}`
      }, user);
    }

    return updatedStay;
  }

  /**
   * Registra un pago parcial ("pagar" sin hacer check-out). Sirve para abonar
   * parte de la cuenta (una noche, los mecatos, la lavandería) y que el huesped
   * siga alojado; el saldo se descuenta automáticamente en el check-out final.
   */
  async registerPayment(id: number, dto: RegisterStayPaymentDto, user: JwtPayload) {
    const stay = await this.prisma.stay.findUnique({
      where: { id },
      include: {
        client: true,
        room: true,
        reservation: { include: { payments: true } },
        sales: { include: { product: true }, orderBy: { date: 'asc' } },
        payments: { orderBy: { createdAt: 'asc' } }
      }
    });

    if (!stay) {
      throw new NotFoundException('Hospedaje no encontrado');
    }

    if (stay.status !== 'ACTIVA') {
      throw new BadRequestException('Solo se pueden registrar pagos en hospedajes activos.');
    }

    const laundryOrders = await this.prisma.laundry.findMany({
      where: { roomNumber: stay.roomNumber, createdAt: { gte: stay.checkIn } }
    });
    const policy = await this.settings.get();
    const tolerance = policy.checkoutTolerance;
    const currentCharge = calculateStayCharge(
      stay.checkIn,
      new Date(),
      Number(stay.pricePerNight),
      tolerance,
      policy.checkoutOvertimeRate,
      policy.checkoutLimit
    );
    const account = computeStayAccount(
      stay,
      laundryOrders,
      currentCharge.nights,
      currentCharge.total - currentCharge.overtimeAmount
    );

    const amount = Number(dto.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestException('El monto del pago debe ser mayor que cero.');
    }
    // Tolerancia de 1 peso por redondeos al teclear el total.
    if (amount > account.balance + 1) {
      throw new BadRequestException(
        `El monto supera el saldo pendiente ($${Math.round(account.balance).toLocaleString('es-CO')}).`
      );
    }

    const payment = await this.prisma.stayPayment.create({
      data: {
        stayId: id,
        userId: user.sub,
        amount: new Prisma.Decimal(Math.min(amount, account.balance)),
        method: dto.method.trim(),
        reference: dto.reference?.trim() || null
      }
    });

    await this.auditoria.log(user, {
      action: 'UPDATE',
      entity: 'STAY',
      entityId: stay.id.toString(),
      description: `Registró pago de $${Math.round(Number(payment.amount)).toLocaleString('es-CO')} (${payment.method}) a ${stay.client.firstName} ${stay.client.lastName}, habitación ${stay.roomNumber}. Saldo restante: $${Math.round(Math.max(0, account.balance - Number(payment.amount))).toLocaleString('es-CO')}.`,
      newValue: payment
    });

    await this.finance.registerAutomatic({
      type: 'INGRESO',
      category: 'Hospedaje',
      description: `Pago hospedaje habitación ${stay.roomNumber} (${stay.client.firstName} ${stay.client.lastName})`,
      amount: Number(payment.amount),
      notes: `Automático: pago parcial hospedaje ID ${stay.id}`
    }, user);

    return payment;
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

      const policy = await this.settings.get();
      updateData.acTypeUsed = dto.acTypeUsed;
      updateData.pricePerNight = newPricePerNight;
      updateData.total = calculateStayCharge(
        stay.checkIn,
        new Date(),
        Number(newPricePerNight),
        policy.checkoutTolerance,
        policy.checkoutOvertimeRate,
        policy.checkoutLimit
      ).total;
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

    // 3. Marcar el hospedaje como cancelado y liberar la habitación en una
    // sola transacción. Si hay una reserva confirmada para hoy, queda
    // RESERVADA para el siguiente huésped.
    const updatedStay = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.stay.update({
        where: { id },
        data: { status: 'CANCELADA' },
        include: {
          client: true,
          room: true
        }
      });
      await releaseRoomToAvailability(tx, stay.roomNumber);
      return updated;
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

  async remove(id: number, adminPassword: string, user: JwtPayload) {
    if (user.role !== 'ADMIN') throw new ForbiddenException('Solo un administrador puede eliminar hospedajes.');
    await assertAdminPassword(this.prisma, adminPassword);
    const stay = await this.prisma.stay.findUnique({ where: { id }, include: { client: true } });
    if (!stay) throw new NotFoundException('Hospedaje no encontrado.');
    if (stay.status === 'ACTIVA') throw new ConflictException('No se puede eliminar un hospedaje activo.');
    await this.prisma.$transaction(async (tx) => {
      const sales = await tx.sale.findMany({ where: { stayId: id }, select: { id: true, productId: true, quantity: true } });
      for (const sale of sales) {
        await tx.stock.updateMany({ where: { productId: sale.productId }, data: { quantity: { increment: sale.quantity } } });
      }
      await tx.payment.deleteMany({ where: { saleId: { in: sales.map((sale) => sale.id) } } });
      await tx.sale.deleteMany({ where: { stayId: id } });
      await tx.stayPayment.deleteMany({ where: { stayId: id } });
      await tx.parkingSession.deleteMany({ where: { stayId: id } });
      await tx.stay.delete({ where: { id } });
    });
    await this.auditoria.log(user, { action: 'DELETE', entity: 'STAY', entityId: String(id), oldValue: stay, description: `Eliminó hospedaje de ${stay.client.firstName} ${stay.client.lastName}.` });
    return { message: 'Hospedaje eliminado.' };
  }
}
