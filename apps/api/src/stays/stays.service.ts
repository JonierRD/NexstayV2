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
        room: true,
        // Sin esto el huesped aparece siempre sin consumos.
        sales: { include: { product: true }, orderBy: { date: 'asc' } }
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

  async checkin(dto: CheckinDto, user: JwtPayload) {
    const nights = dto.nights || 1;

    // Todo el registro del hospedaje ocurre en una única transacción para que dos
    // check-ins simultaneos sobre la misma habitacion no puedan aceptarse ambos.
    const { stay, client, clientCreated } = await this.prisma.$transaction(
      async (tx) => {
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

        // 4. Validar A/C
        if (dto.acType === 'AIRE' && !room.hasAir) {
          throw new BadRequestException('La habitación no tiene aire acondicionado');
        }
        if (dto.acType === 'VENTILADOR' && !room.hasFan) {
          throw new BadRequestException('La habitación no tiene ventilador');
        }

        // 5. Calcular precio según A/C
        const pricePerNight =
          dto.acType === 'AIRE' ? room.priceWithAir : room.priceWithFan;

        if (!pricePerNight || Number(pricePerNight) <= 0) {
          throw new BadRequestException(
            `No hay precio configurado para ${dto.acType} en esta habitación`
          );
        }

        const total = Number(pricePerNight) * nights;

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
        newValue: JSON.stringify(client)
      });
    }

    await this.auditoria.log(user, {
      action: 'CHECK_IN',
      entity: 'STAY',
      entityId: stay.id.toString(),
      description: `Check-in: ${client.firstName} ${client.lastName} en habitación ${dto.roomNumber} (${dto.acType}, ${nights} noches)`,
      newValue: JSON.stringify(stay)
    });

    return stay;
  }

  async checkout(id: number, user: JwtPayload) {
    // 1. Buscar el stay
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
      action: 'CHECK_OUT',
      entity: 'STAY',
      entityId: stay.id.toString(),
      description: `Check-out: ${stay.client.firstName} ${stay.client.lastName} de habitación ${stay.roomNumber} (${nightsReal} noches, total: $${Math.round(grandTotal).toLocaleString('es-CO')})`,
      oldValue: JSON.stringify(stay),
      newValue: JSON.stringify(updatedStay)
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
        oldValue: JSON.stringify(stay),
        newValue: JSON.stringify(updatedStay)
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
      oldValue: JSON.stringify(stay),
      newValue: JSON.stringify(updatedStay)
    });

    return updatedStay;
  }
}