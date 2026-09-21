import {
  Injectable,
  NotFoundException,
  ConflictException
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { assertAdminPassword } from '../auth/admin-password';
import type { JwtPayload } from '../auth/auth.types';
import type { CreateClienteDto } from './dto/create-cliente.dto';
import type { UpdateClienteDto } from './dto/update-cliente.dto';
import { AuditoriaService, AuditAction } from '../auditoria/auditoria.service';

@Injectable()
export class ClientesService {
  constructor(
    private prisma: PrismaService,
    private auditoria: AuditoriaService
  ) {}

  async findAll() {
    return this.prisma.client.findMany({
      include: {
        stays: {
          include: {
            room: true
          },
          orderBy: { checkIn: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findOne(id: number) {
    const client = await this.prisma.client.findUnique({
      where: { id },
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

  async findByCc(cc: string) {
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

  async create(dto: CreateClienteDto, user: JwtPayload) {
    // Validar contraseña admin si no es ADMIN
    if (user.role !== Role.ADMIN) {
      await this.requireAdminPassword(dto.adminPassword);
    }

    // Verificar duplicado por cédula
    const existing = await this.prisma.client.findUnique({
      where: { cc: dto.cc }
    });

    if (existing) {
      throw new ConflictException(`Ya existe un cliente con la cédula ${dto.cc}`);
    }

    // Crear cliente
    const client = await this.prisma.client.create({
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        cc: dto.cc,
        phone: dto.phone,
        cityOrigin: dto.cityOrigin,
        cityDestination: dto.cityDestination,
        profession: dto.profession,
        notes: dto.notes
      }
    });

    // Auditoría
    await this.auditoria.log(user, {
      action: 'CREATE',
      entity: 'CLIENTE',
      entityId: client.id.toString(),
      description: `Creó cliente: ${client.firstName} ${client.lastName} (CC: ${client.cc})`,
      newValue: JSON.stringify(client)
    });

    return client;
  }

  async update(id: number, dto: UpdateClienteDto, user: JwtPayload) {
    // Validar contraseña admin si no es ADMIN
    if (user.role !== Role.ADMIN) {
      await this.requireAdminPassword(dto.adminPassword);
    }

    // Buscar cliente
    const existing = await this.prisma.client.findUnique({
      where: { id }
    });

    if (!existing) {
      throw new NotFoundException('Cliente no encontrado');
    }

    // Actualizar
    const client = await this.prisma.client.update({
      where: { id },
      data: {
        ...(dto.firstName !== undefined && { firstName: dto.firstName }),
        ...(dto.lastName !== undefined && { lastName: dto.lastName }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.cityOrigin !== undefined && { cityOrigin: dto.cityOrigin }),
        ...(dto.cityDestination !== undefined && { cityDestination: dto.cityDestination }),
        ...(dto.profession !== undefined && { profession: dto.profession }),
        ...(dto.notes !== undefined && { notes: dto.notes })
      }
    });

    // Auditoría
    const changes: string[] = [];
    if (dto.firstName !== undefined && dto.firstName !== existing.firstName) changes.push(`nombre de ${existing.firstName} a ${dto.firstName}`);
    if (dto.lastName !== undefined && dto.lastName !== existing.lastName) changes.push(`apellido de ${existing.lastName} a ${dto.lastName}`);
    if (dto.phone !== undefined && dto.phone !== existing.phone) changes.push('teléfono');
    if (dto.cityOrigin !== undefined && dto.cityOrigin !== existing.cityOrigin) changes.push('ciudad origen');
    if (dto.cityDestination !== undefined && dto.cityDestination !== existing.cityDestination) changes.push('ciudad destino');
    if (dto.profession !== undefined && dto.profession !== existing.profession) changes.push('profesión');
    if (dto.notes !== undefined && dto.notes !== existing.notes) changes.push('notas');

    if (changes.length > 0) {
      await this.auditoria.log(user, {
        action: 'UPDATE',
        entity: 'CLIENTE',
        entityId: id.toString(),
        description: `Actualizó cliente ID ${id}: ${changes.join(', ')}`,
        oldValue: JSON.stringify(existing),
        newValue: JSON.stringify(client)
      });
    }

    return client;
  }

  async remove(id: number, adminPassword: string, user: JwtPayload) {
    // Validar contraseña admin si no es ADMIN
    if (user.role !== Role.ADMIN) {
      await this.requireAdminPassword(adminPassword);
    }

    // Buscar cliente
    const client = await this.prisma.client.findUnique({
      where: { id },
      include: {
        stays: true
      }
    });

    if (!client) {
      throw new NotFoundException('Cliente no encontrado');
    }

    // No se puede eliminar un cliente que tenga algún hospedaje,
    // activo o histórico (la FK de Stay.clientId no lo permite)
    if (client.stays.length > 0) {
      throw new ConflictException(
        'No se puede eliminar un cliente con historial de hospedajes'
      );
    }

    // Eliminar
    try {
      await this.prisma.client.delete({ where: { id } });
    } catch {
      throw new ConflictException(
        'No se pudo eliminar el cliente porque tiene registros relacionados.'
      );
    }

    // Auditoría
    await this.auditoria.log(user, {
      action: 'DELETE',
      entity: 'CLIENTE',
      entityId: id.toString(),
      description: `Eliminó cliente: ${client.firstName} ${client.lastName} (CC: ${client.cc})`,
      oldValue: JSON.stringify(client)
    });

    return { message: 'Cliente eliminado' };
  }

  private async requireAdminPassword(password?: string): Promise<void> {
    return assertAdminPassword(this.prisma, password);
  }
}