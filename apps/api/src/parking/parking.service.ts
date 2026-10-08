import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { Prisma, type ParkingSession, type VehicleType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import type { JwtPayload } from '../auth/auth.types';
import type { CreateParkingSessionDto } from './dto/create-parking-session.dto';
import type { UpdateParkingRatesDto } from './dto/update-parking-rates.dto';

@Injectable()
export class ParkingService {
  constructor(
    private prisma: PrismaService,
    private auditoria: AuditoriaService
  ) {}

  async getRates() {
    return this.prisma.parkingRates.upsert({
      where: { id: 1 },
      create: { id: 1 },
      update: {}
    });
  }

  async updateRates(dto: UpdateParkingRatesDto, user: JwtPayload) {
    const previous = await this.getRates();
    const rates = await this.prisma.parkingRates.update({
      where: { id: 1 },
      data: {
        motorcycleHourlyRate: dto.motorcycleHourlyRate,
        carHourlyRate: dto.carHourlyRate
      }
    });
    await this.auditoria.log(user, {
      action: 'UPDATE',
      entity: 'TARIFAS_PARQUEADERO',
      entityId: '1',
      description: 'Actualizó las tarifas por hora de moto y carro.',
      oldValue: previous,
      newValue: rates
    });
    return rates;
  }

  async findAll() {
    const sessions = await this.prisma.parkingSession.findMany({ orderBy: { entryAt: 'desc' } });
    const ccs = [...new Set(sessions.map((session) => session.ownerCc))];
    const activeStays = ccs.length
      ? await this.prisma.stay.findMany({
          where: { status: 'ACTIVA', client: { cc: { in: ccs } } },
          select: { client: { select: { cc: true } } }
        })
      : [];
    const activeGuestCcs = new Set(activeStays.map((stay) => stay.client.cc));
    return sessions.map((session) => ({
      ...session,
      isHosted: session.hostedAtEntry ||
        (['EN_CURSO', 'PENDIENTE_PAGO'].includes(session.status) && activeGuestCcs.has(session.ownerCc))
    }));
  }

  async findOne(id: number) {
    const session = await this.prisma.parkingSession.findUnique({ where: { id } });
    if (!session) throw new NotFoundException('Registro de parqueadero no encontrado.');
    const shouldCheckStay = session.status === 'EN_CURSO' || session.status === 'PENDIENTE_PAGO';
    const activeStay = shouldCheckStay ? await this.findActiveStay(session.ownerCc) : null;
    return { ...session, isHosted: session.hostedAtEntry || Boolean(activeStay) };
  }

  async startSession(dto: CreateParkingSessionDto, user: JwtPayload) {
    if (![dto.ownerName, dto.ownerCc, dto.licensePlate, dto.phone, dto.vehicleLine].every((value) => value.trim())) {
      throw new BadRequestException('Completa los datos del titular y del vehículo.');
    }
    const licensePlate = dto.licensePlate.trim().toUpperCase();
    const ownerCc = dto.ownerCc.trim();
    const session = await this.prisma.$transaction(async (tx) => {
      const activeSession = await tx.parkingSession.findFirst({
        where: { licensePlate, status: 'EN_CURSO' }
      });
      if (activeSession) throw new ConflictException('Este vehículo ya tiene una entrada sin cerrar.');

      const pendingSession = await tx.parkingSession.findFirst({
        where: { licensePlate, status: 'PENDIENTE_PAGO' }
      });
      if (pendingSession) throw new ConflictException('Este vehículo tiene un cobro pendiente de pago.');

      const activeStay = await tx.stay.findFirst({
        where: { status: 'ACTIVA', client: { cc: ownerCc } },
        select: { id: true }
      });
      const rates = await tx.parkingRates.upsert({
        where: { id: 1 },
        create: { id: 1 },
        update: {}
      });
      const hourlyRate = this.rateForVehicle(dto.vehicleType, rates);
      return tx.parkingSession.create({
        data: {
          ownerName: dto.ownerName.trim(),
          ownerCc,
          licensePlate,
          phone: dto.phone.trim(),
          vehicleLine: dto.vehicleLine.trim(),
          vehicleType: dto.vehicleType,
          hourlyRate,
          hostedAtEntry: Boolean(activeStay),
          notes: dto.notes?.trim() || null
        }
      });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    await this.auditoria.log(user, {
      action: 'CREATE',
      entity: 'PARQUEADERO_SESION',
      entityId: String(session.id),
      description: `Registró entrada de ${session.licensePlate}${session.hostedAtEntry ? ' (huésped, sin cobro)' : ''}.`,
      newValue: session
    });
    return this.findOne(session.id);
  }

  async checkout(id: number, user: JwtPayload) {
    const result = await this.prisma.$transaction(async (tx) => {
      const session = await tx.parkingSession.findUnique({ where: { id } });
      if (!session) throw new NotFoundException('Registro de parqueadero no encontrado.');
      if (session.status !== 'EN_CURSO') throw new ConflictException('La sesión ya fue cerrada.');

      const activeStay = await tx.stay.findFirst({
        where: { status: 'ACTIVA', client: { cc: session.ownerCc } },
        select: { id: true }
      });
      const isHosted = session.hostedAtEntry || Boolean(activeStay);
      const exitAt = new Date();
      const elapsedHours = Math.max(0, (exitAt.getTime() - session.entryAt.getTime()) / 3_600_000);
      const billedHours = isHosted ? 0 : Math.max(1, Math.ceil(elapsedHours));
      const totalPrice = isHosted ? 0 : billedHours * Number(session.hourlyRate);
      const updated = await tx.parkingSession.update({
        where: { id },
        data: {
          exitAt,
          billedHours,
          totalPrice,
          status: isHosted ? 'EXONERADO' : 'PENDIENTE_PAGO'
        }
      });
      return { previous: session, updated };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    await this.auditoria.log(user, {
      action: 'UPDATE',
      entity: 'PARQUEADERO_SESION',
      entityId: String(id),
      description: `Cerró sesión ${result.updated.licensePlate}: ${result.updated.billedHours} hora(s), total ${result.updated.totalPrice}.`,
      oldValue: result.previous,
      newValue: result.updated
    });
    return this.findOne(id);
  }

  async pay(id: number, user: JwtPayload) {
    const result = await this.prisma.$transaction(async (tx) => {
      const session = await tx.parkingSession.findUnique({ where: { id } });
      if (!session) throw new NotFoundException('Registro de parqueadero no encontrado.');
      if (session.status !== 'PENDIENTE_PAGO') throw new ConflictException('Esta sesión no tiene un pago pendiente.');

      const activeStay = await tx.stay.findFirst({
        where: { status: 'ACTIVA', client: { cc: session.ownerCc } },
        select: { id: true }
      });
      if (session.hostedAtEntry || activeStay) {
        return tx.parkingSession.update({
          where: { id },
          data: { status: 'EXONERADO', totalPrice: 0, billedHours: 0 }
        });
      }
      return tx.parkingSession.update({
        where: { id },
        data: { status: 'PAGADO', paidAt: new Date() }
      });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    await this.auditoria.log(user, {
      action: 'UPDATE',
      entity: 'PARQUEADERO_SESION',
      entityId: String(id),
      description: `Registró pago de parqueadero para ${result.licensePlate}: ${result.totalPrice}.`,
      newValue: result
    });
    return this.findOne(id);
  }

  private rateForVehicle(vehicleType: VehicleType, rates: { motorcycleHourlyRate: Prisma.Decimal; carHourlyRate: Prisma.Decimal }): Prisma.Decimal {
    return vehicleType === 'MOTO' ? rates.motorcycleHourlyRate : rates.carHourlyRate;
  }

  private findActiveStay(ownerCc: string) {
    return this.prisma.stay.findFirst({
      where: { status: 'ACTIVA', client: { cc: ownerCc } },
      select: { id: true }
    });
  }
}