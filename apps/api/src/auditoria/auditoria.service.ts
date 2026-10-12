import { Injectable } from '@nestjs/common';
import { $Enums } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { JwtPayload } from '../auth/auth.types';

export type AuditAction = $Enums.AuditAction;

/**
 * Los valores se reciben como objetos y se serializan aqui, para que ningun
 * call site tenga que acordarse de JSON.stringify: era la forma facil de dejar
 * un log de auditoria sin datos.
 */
function serialize(value: unknown): string | null {
  if (value === undefined || value === null) {
    return null;
  }
  return JSON.stringify(value) ?? null;
}

export interface AuditLogOptions {
  action: AuditAction;
  entity: string;
  entityId?: string;
  oldValue?: unknown;
  newValue?: unknown;
  description: string;
  ipAddress?: string;
}

@Injectable()
export class AuditoriaService {
  constructor(private prisma: PrismaService) {}

  async log(user: JwtPayload, options: AuditLogOptions) {
    return this.prisma.auditLog.create({
      data: {
        userId: user.sub,
        action: options.action,
        entity: options.entity,
        entityId: options.entityId,
        oldValue: serialize(options.oldValue),
        newValue: serialize(options.newValue),
        description: options.description,
        ipAddress: options.ipAddress
      }
    });
  }

  async findAll(filters?: {
    userId?: string;
    action?: AuditAction;
    entity?: string;
    entityId?: string;
startDate?: Date;
     endDate?: Date;
     search?: string;
     limit?: number;
     offset?: number;
   }) {
    const where: any = {};

    if (filters?.userId) {
      where.userId = filters.userId;
    }

    if (filters?.action) {
      where.action = filters.action;
    }

    if (filters?.entity) {
      where.entity = filters.entity;
    }

    if (filters?.entityId) {
      where.entityId = filters.entityId;
    }

    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate;
      }
    }

    // Busqueda por texto sobre la descripcion, el usuario o la entidad, para que
    // el filtro alcance todo el historial y no solo la pagina cargada.
    if (filters?.search) {
      where.OR = [
        { description: { contains: filters.search, mode: 'insensitive' } },
        { entity: { contains: filters.search, mode: 'insensitive' } },
        { user: { fullName: { contains: filters.search, mode: 'insensitive' } } }
      ];
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              role: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: filters?.limit || 100,
        skip: filters?.offset || 0
      }),
      this.prisma.auditLog.count({ where })
    ]);

    return { logs, total };
  }

  async findByEntity(entity: string, entityId: string) {
    return this.prisma.auditLog.findMany({
      where: { entity, entityId },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            role: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async remove(id: number) {
    return this.prisma.auditLog.delete({
      where: { id }
    });
  }

  async removeMany(ids: number[]) {
    return this.prisma.auditLog.deleteMany({
      where: { id: { in: ids } }
    });
  }
}