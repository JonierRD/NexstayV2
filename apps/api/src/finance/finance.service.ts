import { Injectable, NotFoundException } from '@nestjs/common';
import { $Enums, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { JwtPayload } from '../auth/auth.types';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { CreateFinanceMovementDto } from './dto/create-finance-movement.dto';
import { UpdateFinanceMovementDto } from './dto/update-finance-movement.dto';

export type FinanceMovementType = $Enums.FinanceMovementType;

type FinanceMovementRow = {
  id: number;
  type: FinanceMovementType;
  category: string;
  description: string;
  amount: unknown;
  movementDate: Date;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

// Prisma.Decimal viaja como string en JSON; el front espera numeros.
function serialize(row: FinanceMovementRow) {
  return { ...row, amount: Number(row.amount) };
}

// Las columnas @db.Date exigen medianoche UTC para que la fecha no se
// corrija un dia al mostrarse desde America/Bogota.
function toUtcDate(isoDate: string): Date {
  return new Date(`${isoDate.slice(0, 10)}T00:00:00.000Z`);
}

export type AutomaticMovementInput = {
  type: FinanceMovementType;
  category: string;
  description: string;
  amount: number;
  notes?: string;
};

@Injectable()
export class FinanceService {
  constructor(
    private prisma: PrismaService,
    private auditoria: AuditoriaService
  ) {}

  async listMovements(type?: FinanceMovementType) {
    const rows = await this.prisma.financeMovement.findMany({
      where: type ? { type } : undefined,
      orderBy: [{ movementDate: 'desc' }, { createdAt: 'desc' }],
      take: 500
    });
    return rows.map(serialize);
  }

  async summary() {
    const [incomeAgg, expenseAgg] = await Promise.all([
      this.prisma.financeMovement.aggregate({
        where: { type: 'INGRESO' },
        _sum: { amount: true }
      }),
      this.prisma.financeMovement.aggregate({
        where: { type: 'GASTO' },
        _sum: { amount: true }
      })
    ]);
    const income = Number(incomeAgg._sum.amount ?? 0);
    const expense = Number(expenseAgg._sum.amount ?? 0);
    return { income, expense, balance: income - expense };
  }

  async findOne(id: number) {
    const row = await this.prisma.financeMovement.findUnique({ where: { id } });
    if (!row) {
      throw new NotFoundException('Movimiento no encontrado.');
    }
    return serialize(row);
  }

  async create(data: CreateFinanceMovementDto, user: JwtPayload) {
    const row = await this.prisma.financeMovement.create({
      data: {
        type: data.type,
        category: data.category.trim(),
        description: data.description.trim(),
        amount: data.amount,
        movementDate: data.date ? toUtcDate(data.date) : new Date(),
        notes: data.notes?.trim() || null
      }
    });

    await this.auditoria.log(user, {
      action: 'CREATE',
      entity: 'MOVIMIENTO_FINANCIERO',
      entityId: row.id.toString(),
      description: `Registró ${data.type.toLowerCase()}: ${row.description} ($${Math.round(data.amount).toLocaleString('es-CO')}).`,
      newValue: row
    });

    return serialize(row);
  }

  async update(id: number, data: UpdateFinanceMovementDto, user: JwtPayload) {
    const existing = await this.prisma.financeMovement.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Movimiento no encontrado.');
    }

    const row = await this.prisma.financeMovement.update({
      where: { id },
      data: {
        type: data.type,
        category: data.category?.trim(),
        description: data.description?.trim(),
        amount: data.amount,
        movementDate: data.date ? toUtcDate(data.date) : undefined,
        notes: data.notes !== undefined ? data.notes.trim() || null : undefined
      }
    });

    await this.auditoria.log(user, {
      action: 'UPDATE',
      entity: 'MOVIMIENTO_FINANCIERO',
      entityId: id.toString(),
      description: `Actualizó movimiento ID ${id}: ${row.description}.`,
      oldValue: existing,
      newValue: row
    });

    return serialize(row);
  }

  async remove(id: number, user: JwtPayload) {
    const existing = await this.prisma.financeMovement.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Movimiento no encontrado.');
    }

    await this.prisma.financeMovement.delete({ where: { id } });

    await this.auditoria.log(user, {
      action: 'DELETE',
      entity: 'MOVIMIENTO_FINANCIERO',
      entityId: id.toString(),
      description: `Eliminó movimiento ID ${id}: ${existing.description}.`,
      oldValue: existing
    });

    return { message: 'Movimiento eliminado.' };
  }

  /**
   * Registro automatico usado por otros modulos (hospedajes, reservas) para que
   * el dinero que ya se cobro o devolvio aparezca en Ingresos y Gastos sin
   * captura manual. No lanza excepciones: un fallo de contabilidad nunca debe
   * tumbar el check-in o cobro que lo origino.
   */
  async registerAutomatic(input: AutomaticMovementInput, user?: JwtPayload) {
    if (!Number.isFinite(input.amount) || input.amount <= 0) return null;
    try {
      const row = await this.prisma.financeMovement.create({
        data: {
          type: input.type,
          category: input.category,
          description: input.description,
          amount: Math.round(input.amount),
          movementDate: new Date(),
          notes: input.notes ?? 'Registro automático'
        }
      });
      if (user) {
        await this.auditoria.log(user, {
          action: 'CREATE',
          entity: 'MOVIMIENTO_FINANCIERO',
          entityId: row.id.toString(),
          description: `Registro automático: ${row.description} ($${Math.round(Number(row.amount)).toLocaleString('es-CO')}).`,
          newValue: row
        });
      }
      return serialize(row);
    } catch {
      return null;
    }
  }
}
