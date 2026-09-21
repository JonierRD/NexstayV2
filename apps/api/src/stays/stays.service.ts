import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
  ForbiddenException
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { verifyPassword } from '../auth/password';
import type { JwtPayload } from '../auth/auth.types';
import type { CheckinDto } from './dto/checkin.dto';
import type { CheckoutDto } from './dto/checkout.dto';
import type { UpdateStayDto } from './dto/update-stay.dto';
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
    return this.prisma.stay.findMany({
      where: { status: 'ACTIVA' },
      include: {
        client: true,
        room: true
      },
      orderBy: { checkIn: 'desc' }
    });
  }

  async findOne(id: number) {
    const stay = await this.prisma.stay.findUnique({
      where: { id },
      include: {
        client: true,
        room: true,
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
        room: true
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

  async checkin(dto: CheckinDto, user: JwtPayload) {
    // 1. Validar contraseña admin si no es ADMIN
    if (user.role !== Role.ADMIN) {
      await this.requireAdminPassword(dto.adminPassword);
    }

    // 2. Buscar cliente por cédula
    let client = await this.prisma.client.findUnique({
      where: { cc: dto.cc }
    });

    // 3. Si no existe, crearlo
    if (!client) {
      if (!dto.firstName || !dto.lastName) {
        throw new BadRequestException(
          'Para un nuevo cliente se requiere nombre y apellido'
        );
      }

      client = await this.prisma.client.create({
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

      // Auditoría de creación de cliente
      await this.auditoria.log(user, {
        action: 'CREATE' as any,
        entity: 'CLIENTE',
        entityId: client.id.toString(),
        description: `Creó cliente: ${client.firstName} ${client.lastName} (CC: ${client.cc})`,
        newValue: JSON.stringify(client)
      });
    }

    // 4. Validar habitación
    const room = await this.prisma.room.findUnique({
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

    // 5. Validar A/C
    if (dto.acType === 'AIRE' && !room.hasAir) {
      throw new BadRequestException('La habitación no tiene aire acondicionado');
    }
    if (dto.acType === 'VENTILADOR' && !room.hasFan) {
      throw new BadRequestException('La habitación no tiene ventilador');
    }

    // 6. Calcular precio según A/C
    const pricePerNight = dto.acType === 'AIRE' ? room.priceWithAir : room.priceWithFan;
    
    if (!pricePerNight || Number(pricePerNight) <= 0) {
      throw new BadRequestException(
        `No hay precio configurado para ${dto.acType} en esta habitación`
      );
    }

    // 7. Calcular total (noches estimadas o 1 por defecto)
    const nights = dto.nights || 1;
    const total = Number(pricePerNight) * nights;

    // 8. Crear Stay
    const stay = await this.prisma.stay.create({
      data: {
        clientId: client.id,
        roomNumber: dto.roomNumber,
        checkIn: dto.checkIn ? new Date(dto.checkIn) : new Date(),
        nights,
        pricePerNight,
        total,
        acTypeUsed: dto.acType,
        status: 'ACTIVA'
      },
      include: {
        client: true,
        room: true
      }
    });

    // 9. Actualizar habitación a OCUPADA
    await this.prisma.room.update({
      where: { number: dto.roomNumber },
      data: { status: 'OCUPADA' }
    });

    // 10. Auditoría del check-in
    await this.auditoria.log(user, {
      action: 'CHECK_IN' as any,
      entity: 'STAY',
      entityId: stay.id.toString(),
      description: `Check-in: ${client.firstName} ${client.lastName} en habitación ${dto.roomNumber} (${dto.acType}, ${nights} noches)`,
      newValue: JSON.stringify(stay)
    });

    return stay;
  }

  async checkout(id: number, dto: CheckoutDto, user: JwtPayload) {
    // 1. Validar contraseña admin si no es ADMIN
    if (user.role !== Role.ADMIN) {
      await this.requireAdminPassword(dto.adminPassword);
    }

    // 2. Buscar el stay
    const stay = await this.prisma.stay.findUnique({
      where: { id },
      include: {
        client: true,
        room: true,
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

    // 3. Calcular noches reales y totales
    const checkOut = new Date();
    const checkIn = new Date(stay.checkIn);
    const nightsReal = Math.ceil(
      (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
    ) || 1;

    const totalRoom = Number(stay.pricePerNight) * nightsReal;
    
    // Calcular total de ventas (tienda)
    const totalSales = stay.sales.reduce((sum, sale) => {
      return sum + (Number(sale.unitPrice) * sale.quantity);
    }, 0);

    const grandTotal = totalRoom + totalSales;

    // 4. Actualizar el stay
    const updatedStay = await this.prisma.stay.update({
      where: { id },
      data: {
        checkOut,
        nights: nightsReal,
        total: grandTotal,
        status: 'FINALIZADA'
      },
      include: {
        client: true,
        room: true
      }
    });

    // 5. Actualizar habitación a DISPONIBLE
    await this.prisma.room.update({
      where: { number: stay.roomNumber },
      data: { status: 'DISPONIBLE' }
    });

    // 6. Auditoría del check-out
    await this.auditoria.log(user, {
      action: 'CHECK_OUT' as any,
      entity: 'STAY',
      entityId: stay.id.toString(),
      description: `Check-out: ${stay.client.firstName} ${stay.client.lastName} de habitación ${stay.roomNumber} (${nightsReal} noches, total: $${Math.round(grandTotal).toLocaleString('es-CO')})`,
      oldValue: JSON.stringify(stay),
      newValue: JSON.stringify(updatedStay)
    });

    return updatedStay;
  }

  async update(id: number, dto: UpdateStayDto, user: JwtPayload) {
    // 1. Validar contraseña admin si no es ADMIN
    if (user.role !== Role.ADMIN) {
      await this.requireAdminPassword(dto.adminPassword);
    }

    // 2. Buscar el stay
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
    const updateData: any = {};

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
        action: 'UPDATE' as any,
        entity: 'STAY',
        entityId: id.toString(),
        description: `Actualizó hospedaje ID ${id}: ${changes.join(', ')}`,
        oldValue: JSON.stringify(stay),
        newValue: JSON.stringify(updatedStay)
      });
    }

    return updatedStay;
  }

  async cancel(id: number, adminPassword: string, user: JwtPayload) {
    // 1. Validar contraseña admin si no es ADMIN
    if (user.role !== Role.ADMIN) {
      await this.requireAdminPassword(adminPassword);
    }

    // 2. Buscar el stay
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
      action: 'UPDATE' as any,
      entity: 'STAY',
      entityId: id.toString(),
      description: `Canceló hospedaje: ${stay.client.firstName} ${stay.client.lastName} en habitación ${stay.roomNumber}`,
      oldValue: JSON.stringify(stay),
      newValue: JSON.stringify(updatedStay)
    });

    return updatedStay;
  }

  private async requireAdminPassword(password?: string): Promise<void> {
    if (!password?.trim()) {
      throw new UnauthorizedException(
        'Se requiere la contraseña de un administrador activo para esta acción.'
      );
    }

    const adminUser = await this.prisma.user.findFirst({
      where: { role: Role.ADMIN, isActive: true }
    });

    if (!adminUser) {
      throw new ForbiddenException('No hay un administrador activo en el sistema.');
    }

    const isValid = await verifyPassword(password, adminUser.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('La contraseña del administrador no es correcta.');
    }
  }
}