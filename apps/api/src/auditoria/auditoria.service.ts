import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { JwtPayload } from '../auth/auth.types';

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'CHECK_IN' | 'CHECK_OUT' | 'STATUS_CHANGE';

export interface AuditLogOptions {
  action: AuditAction;
  entity: string;
  entityId?: string;
  oldValue?: string;
  newValue?: string;
  description: string;
  ipAddress?: string;
}

@Injectable()
export class AuditoriaService {
  constructor(private prisma: PrismaService) {}

  async log(user: JwtPayload, options: AuditLogOptions) {
    return (this.prisma as any).auditLog.create({
      data: {
        userId: user.sub,
        action: options.action as any,
        entity: options.entity,
        entityId: options.entityId,
        oldValue: options.oldValue,
        newValue: options.newValue,
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

    const [logs, total] = await Promise.all([
      (this.prisma as any).auditLog.findMany({
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
      (this.prisma as any).auditLog.count({ where })
    ]);

    return { logs, total };
  }

  async findByEntity(entity: string, entityId: string) {
    return (this.prisma as any).auditLog.findMany({
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
}
