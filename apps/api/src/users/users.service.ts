import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { Role, type User } from '@prisma/client';
import { hashPassword } from '../auth/password';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { type AdminUserRow, toAdminUserRow } from './users.types';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(): Promise<AdminUserRow[]> {
    const users = await this.prisma.user.findMany({
      orderBy: [{ role: 'asc' }, { fullName: 'asc' }]
    });
    return users.map(toAdminUserRow);
  }

  async findById(id: string): Promise<AdminUserRow | null> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    return user ? toAdminUserRow(user) : null;
  }

  async create(dto: CreateUserDto): Promise<AdminUserRow> {
    const fullName = dto.fullName.trim();
    const cc = dto.cc.trim();
    const email = dto.email.trim().toLowerCase();
    const phone = dto.phone?.trim();

    if (dto.initialPassword !== dto.confirmPassword) {
      throw new BadRequestException('Las contraseñas no coinciden.');
    }

    const duplicate = await this.prisma.user.findFirst({
      where: {
        OR: [{ cc }, { email: { equals: email, mode: 'insensitive' } }]
      },
      select: { id: true }
    });

    if (duplicate) {
      throw new ConflictException('Ya existe un usuario con esa cédula o correo.');
    }

    const passwordHash = await hashPassword(dto.initialPassword);

    const user = await this.prisma.user.create({
      data: {
        fullName,
        cc,
        email,
        phone: phone || null,
        role: dto.role,
        passwordHash,
        isActive: true
      }
    });

    return toAdminUserRow(user);
  }

  async update(id: string, dto: UpdateUserDto, actorId: string): Promise<AdminUserRow> {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException('El usuario no existe.');
    }

    if (dto.isActive === false && user.id === actorId) {
      throw new ForbiddenException('No puedes desactivar tu propia cuenta.');
    }

    const data: {
      fullName?: string;
      email?: string;
      phone?: string | null;
      role?: Role;
      isActive?: boolean;
    } = {};

    if (dto.fullName !== undefined) {
      data.fullName = dto.fullName.trim();
    }

    if (dto.phone !== undefined) {
      const phone = dto.phone.trim();
      data.phone = phone || null;
    }

    if (dto.email !== undefined) {
      const email = dto.email.trim().toLowerCase();
      const emailInUse = await this.prisma.user.findFirst({
        where: {
          email: { equals: email, mode: 'insensitive' },
          NOT: { id: user.id }
        },
        select: { id: true }
      });
      if (emailInUse) {
        throw new ConflictException('Ese correo electrónico ya está registrado.');
      }
      data.email = email;
    }

    if (dto.role !== undefined) {
      data.role = dto.role;
    }

    if (dto.isActive !== undefined) {
      data.isActive = dto.isActive;
    }

    // Protección: no dejar nunca el sistema sin al menos un ADMIN activo.
    if (user.role === Role.ADMIN && (data.isActive === false || data.role === Role.RECEPTION || data.role === Role.CLEANING)) {
      const otherActiveAdmins = await this.prisma.user.count({
        where: { role: Role.ADMIN, isActive: true, NOT: { id: user.id } }
      });
      if (otherActiveAdmins === 0) {
        throw new BadRequestException(
          'El sistema debe conservar al menos un administrador activo.'
        );
      }
    }

    if (Object.keys(data).length === 0) {
      return toAdminUserRow(user);
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data
    });

    return toAdminUserRow(updated);
  }
}