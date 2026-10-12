import { BadRequestException, ConflictException, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import type { JwtPayload } from '../auth/auth.types';
import { CreateParkingSessionDto } from './dto/create-parking-session.dto';
import { CreateVehicleTypeDto } from './dto/create-vehicle-type.dto';
import { UpdateVehicleTypeDto } from './dto/update-vehicle-type.dto';

function money(value: Prisma.Decimal | number): number {
  return Number(value);
}

@Injectable()
export class ParkingService {
  constructor(private readonly prisma: PrismaService, private readonly auditoria: AuditoriaService) {}

  async listVehicleTypes() {
    await this.ensureDefaultTypes();
    return this.prisma.parkingVehicleType.findMany({ orderBy: { name: 'asc' } });
  }

  async createVehicleType(dto: CreateVehicleTypeDto, user: JwtPayload) {
    const type = await this.prisma.parkingVehicleType.create({
      data: { name: dto.name.trim(), dailyRate: dto.dailyRate, monthlyRate: dto.monthlyRate, isActive: dto.isActive ?? true }
    });
    await this.auditoria.log(user, { action: 'CREATE', entity: 'TIPO_VEHICULO_PARQUEADERO', entityId: String(type.id), newValue: type, description: `Creó tipo de vehículo ${type.name}.` });
    return type;
  }

  async updateVehicleType(id: number, dto: UpdateVehicleTypeDto, user: JwtPayload) {
    const previous = await this.prisma.parkingVehicleType.findUnique({ where: { id } });
    if (!previous) throw new NotFoundException('Tipo de vehículo no encontrado.');
    const type = await this.prisma.parkingVehicleType.update({
      where: { id },
      data: { name: dto.name?.trim(), dailyRate: dto.dailyRate, monthlyRate: dto.monthlyRate, isActive: dto.isActive }
    });
    await this.auditoria.log(user, { action: 'UPDATE', entity: 'TIPO_VEHICULO_PARQUEADERO', entityId: String(id), oldValue: previous, newValue: type, description: `Actualizó el tipo de vehículo ${type.name}.` });
    return type;
  }

  async removeVehicleType(id: number, user: JwtPayload) {
    if (user.role !== Role.ADMIN) throw new ForbiddenException('Solo un administrador puede eliminar tipos de vehículo.');
    const type = await this.prisma.parkingVehicleType.findUnique({ where: { id } });
    if (!type) throw new NotFoundException('Tipo de vehículo no encontrado.');
    const usage = await this.prisma.parkingSession.count({ where: { vehicleTypeId: id } });
    if (usage > 0) throw new ConflictException('No se puede eliminar un tipo que ya tiene movimientos. Puedes desactivarlo.');
    await this.prisma.parkingVehicleType.delete({ where: { id } });
    await this.auditoria.log(user, { action: 'DELETE', entity: 'TIPO_VEHICULO_PARQUEADERO', entityId: String(id), oldValue: type, description: `Eliminó tipo de vehículo ${type.name}.` });
    return { message: 'Tipo de vehículo eliminado.' };
  }

  async listSessions() {
    return this.prisma.parkingSession.findMany({
      include: { vehicleType: true, client: true, stay: { include: { client: true, room: true } } },
      orderBy: { entryAt: 'desc' },
      take: 200
    });
  }

  async remove(id: number, user: JwtPayload) {
    if (user.role !== Role.ADMIN) throw new ForbiddenException('Solo un administrador puede eliminar movimientos.');
    const session = await this.prisma.parkingSession.findUnique({ where: { id }, include: { vehicleType: true } });
    if (!session) throw new NotFoundException('Movimiento de parqueadero no encontrado.');
    if (session.status === 'ACTIVO') throw new ConflictException('No se puede eliminar un ingreso activo; registra primero la salida.');
    await this.prisma.parkingSession.delete({ where: { id } });
    await this.auditoria.log(user, { action: 'DELETE', entity: 'PARQUEADERO', entityId: String(id), oldValue: session, description: `Eliminó movimiento de parqueadero ${session.licensePlate}.` });
    return { message: 'Movimiento eliminado.' };
  }

  async removeMany(ids: number[], user: JwtPayload) {
    if (user.role !== Role.ADMIN) throw new ForbiddenException('Solo un administrador puede eliminar movimientos.');
    const uniqueIds = [...new Set(ids)];
    const sessions = await this.prisma.parkingSession.findMany({ where: { id: { in: uniqueIds } }, include: { vehicleType: true } });
    if (sessions.length !== uniqueIds.length) throw new NotFoundException('Uno o más movimientos no existen.');
    if (sessions.some((session) => session.status === 'ACTIVO')) {
      throw new ConflictException('No se pueden eliminar movimientos activos.');
    }
    await this.prisma.parkingSession.deleteMany({ where: { id: { in: uniqueIds } } });
    for (const session of sessions) {
      await this.auditoria.log(user, { action: 'DELETE', entity: 'PARQUEADERO', entityId: String(session.id), oldValue: session, description: `Eliminó movimiento de parqueadero ${session.licensePlate}.` });
    }
    return { message: `${sessions.length} movimiento(s) eliminado(s).` };
  }

  async createSession(dto: CreateParkingSessionDto, user: JwtPayload) {
    const vehicleType = await this.prisma.parkingVehicleType.findUnique({ where: { id: dto.vehicleTypeId } });
    if (!vehicleType || !vehicleType.isActive) throw new BadRequestException('El tipo de vehículo no está disponible.');
    const plate = dto.licensePlate.trim().toUpperCase();
    const active = await this.prisma.parkingSession.findFirst({ where: { licensePlate: plate, status: 'ACTIVO' } });
    if (active) throw new ConflictException('Este vehículo ya tiene un ingreso activo.');

    let clientId: number | undefined;
    const phone = dto.phone.trim();
    const client = await this.prisma.client.upsert({
      where: { cc: dto.clientCc.trim() },
      update: { firstName: dto.clientFirstName.trim(), lastName: dto.clientLastName.trim(), phone },
      create: {
        firstName: dto.clientFirstName.trim(),
        lastName: dto.clientLastName.trim(),
        cc: dto.clientCc.trim(),
        phone
      }
    });
    clientId = client.id;
    const ownerName = `${client.firstName} ${client.lastName}`;
    const rate = dto.billingType === 'MENSUAL' ? vehicleType.monthlyRate : vehicleType.dailyRate;
    const session = await this.prisma.parkingSession.create({
      data: {
        clientId,
        licensePlate: plate,
        vehicleBrand: dto.vehicleBrand.trim(),
        vehicleTypeId: vehicleType.id,
        billingType: dto.billingType,
        ownerName,
        phone,
        isGuest: false,
        stayId: null,
        rateApplied: rate,
        amount: rate,
        paid: false,
        notes: dto.notes?.trim() || null
      },
      include: { vehicleType: true }
    });
    await this.auditoria.log(user, { action: 'CREATE', entity: 'PARQUEADERO', entityId: String(session.id), newValue: session, description: `Registró ingreso ${plate}.` });
    return session;
  }

  async closeSession(id: number, user: JwtPayload) {
    const current = await this.prisma.parkingSession.findUnique({ where: { id }, include: { vehicleType: true } });
    if (!current) throw new NotFoundException('Movimiento de parqueadero no encontrado.');
    if (current.status === 'CERRADO') throw new BadRequestException('El vehículo ya tiene salida registrada.');
    const session = await this.prisma.parkingSession.update({
      where: { id },
      data: { status: 'CERRADO', exitAt: new Date() },
      include: { vehicleType: true }
    });
    await this.auditoria.log(user, { action: 'UPDATE', entity: 'PARQUEADERO', entityId: String(id), oldValue: current, newValue: session, description: `Registró salida del vehículo ${current.licensePlate}.` });
    return session;
  }

  private async ensureDefaultTypes() {
    const count = await this.prisma.parkingVehicleType.count();
    if (count > 0) return;
    await this.prisma.parkingVehicleType.createMany({
      data: [
        { name: 'Carro', dailyRate: 10000, monthlyRate: 180000 },
        { name: 'Moto', dailyRate: 5000, monthlyRate: 90000 },
        { name: 'Camión', dailyRate: 20000, monthlyRate: 350000 }
      ]
    });
  }
}
