import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
  Inject
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigType } from '@nestjs/config';
import { randomBytes } from 'node:crypto';
import { Role, type User } from '@prisma/client';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { hashPassword, verifyPassword } from './password';
import type { AuthenticatedUser, JwtPayload, PublicUser } from './auth.types';
import jwtConfig from './jwt.config';
export type AuthResult = { token: string; expiresIn: number; user: PublicUser };

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly jwt: JwtService,
    @Inject(jwtConfig.KEY)
    private readonly jwtCfg: ConfigType<typeof jwtConfig>
  ) {}

  private toPublicUser(user: User): PublicUser {
    return {
      id: user.id,
      fullName: user.fullName,
      cc: user.cc,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt.toISOString()
    };
  }

  private buildAuthResult(user: User): AuthResult {
    const payload: JwtPayload = {
      sub: user.id,
      role: user.role,
      email: user.email
    };
    const token = this.jwt.sign(payload);
    const expiresInSeconds = this.parseExpiresIn(this.jwtCfg.expiresIn);
    return {
      token,
      expiresIn: expiresInSeconds,
      user: this.toPublicUser(user)
    };
  }

  private parseExpiresIn(value: string): number {
    const match = /^(\d+)([smhd])?$/.exec(value.trim());
    if (!match) {
      return 12 * 60 * 60;
    }
    const n = Number(match[1]);
    const unit = match[2] ?? 's';
    const factor = unit === 'd' ? 86400 : unit === 'h' ? 3600 : unit === 'm' ? 60 : 1;
    return n * factor;
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    const identifier = dto.identifier.trim();

    if (!identifier) {
      throw new UnauthorizedException('Ingresa tu usuario.');
    }

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { cc: identifier },
          { email: { equals: identifier, mode: 'insensitive' } },
          { fullName: { equals: identifier, mode: 'insensitive' } }
        ]
      }
    });

    if (!user) {
      throw new UnauthorizedException('No encontramos un usuario con esos datos.');
    }

    if (user.role !== dto.role) {
      throw new ForbiddenException('El rol no corresponde al usuario seleccionado.');
    }

    if (!user.isActive) {
      throw new ForbiddenException('El usuario estÃ¡ inactivo.');
    }

    const isPasswordValid = await verifyPassword(dto.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('La contraseÃ±a no es correcta.');
    }

    return this.buildAuthResult(user);
  }

  async register(dto: RegisterDto): Promise<AuthResult> {
    const fullName = dto.fullName.trim();
    const cc = dto.cc.trim();
    const email = dto.email.trim().toLowerCase();
    const phone = dto.phone?.trim();

    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Las contraseÃ±as no coinciden.');
    }

    const duplicateUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ cc }, { email: { equals: email, mode: 'insensitive' } }]
      }
    });

    if (duplicateUser) {
      throw new ConflictException('Ya existe un usuario con esa cÃ©dula o correo.');
    }

    const passwordHash = await hashPassword(dto.password);

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

    return this.buildAuthResult(user);
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }> {
    const email = dto.email.trim().toLowerCase();

    const user = await this.prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } }
    });

    if (!user) {
      throw new NotFoundException('No encontramos un usuario con ese correo.');
    }

    if (!user.isActive) {
      throw new ForbiddenException('El usuario estÃ¡ inactivo.');
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();

    const resetToken = await hashPassword(code);

    const resetTokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExpiresAt }
    });

    await this.mail.sendResetCode(email, code, user.fullName);

    return { message: 'Si el correo estÃ¡ registrado, recibirÃ¡s un cÃ³digo de verificaciÃ³n.' };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const email = dto.email.trim().toLowerCase();

    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException('Las contraseÃ±as no coinciden.');
    }

    const user = await this.prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } }
    });

    if (!user || !user.resetToken || !user.resetTokenExpiresAt) {
      throw new UnauthorizedException('No hay una solicitud de restablecimiento activa.');
    }

    if (user.resetTokenExpiresAt < new Date()) {
      throw new UnauthorizedException('El cÃ³digo de verificaciÃ³n ha expirado.');
    }

    const isCodeValid = await verifyPassword(dto.code, user.resetToken);

    if (!isCodeValid) {
      throw new UnauthorizedException('El cÃ³digo de verificaciÃ³n no es correcto.');
    }

    const passwordHash = await hashPassword(dto.newPassword);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpiresAt: null
      }
    });

    return { message: 'ContraseÃ±a restablecida correctamente.' };
  }

  async verifyAdminPassword(password: string): Promise<{ valid: boolean }> {
    return { valid: true };
  }

  async me(payload: JwtPayload): Promise<AuthenticatedUser> {
    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });

    if (!user) {
      throw new UnauthorizedException('La sesiÃ³n ya no es vÃ¡lida.');
    }

    if (!user.isActive) {
      throw new ForbiddenException('El usuario estÃ¡ inactivo.');
    }

    return this.toPublicUser(user);
  }

  async updateProfile(payload: JwtPayload, dto: UpdateProfileDto): Promise<PublicUser> {
    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });

    if (!user) {
      throw new UnauthorizedException('La sesiÃ³n ya no es vÃ¡lida.');
    }

    if (!user.isActive) {
      throw new ForbiddenException('El usuario estÃ¡ inactivo.');
    }

    const data: { fullName?: string; email?: string; phone?: string | null } = {};

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
        throw new ConflictException('Ese correo electrÃ³nico ya estÃ¡ registrado.');
      }
      data.email = email;
    }

    if (dto.fullName !== undefined) {
      const fullName = dto.fullName.trim();
      if (!fullName) {
        throw new BadRequestException('El nombre completo no puede estar vacÃ­o.');
      }
      data.fullName = fullName;
    }

    if (dto.phone !== undefined) {
      const phone = dto.phone.trim();
      data.phone = phone || null;
    }

    if (Object.keys(data).length === 0) {
      return this.toPublicUser(user);
    }

    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data
    });

    return this.toPublicUser(updated);
  }

  async changePassword(payload: JwtPayload, dto: ChangePasswordDto): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });

    if (!user) {
      throw new UnauthorizedException('La sesiÃ³n ya no es vÃ¡lida.');
    }

    if (!user.isActive) {
      throw new ForbiddenException('El usuario estÃ¡ inactivo.');
    }

    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException('Las contraseÃ±as nuevas no coinciden.');
    }

    const isCurrentPasswordValid = await verifyPassword(dto.currentPassword, user.passwordHash);

    if (!isCurrentPasswordValid) {
      throw new BadRequestException('La contraseÃ±a actual no es correcta.');
    }

    const passwordHash = await hashPassword(dto.newPassword);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpiresAt: null
      }
    });

    return { message: 'ContraseÃ±a actualizada correctamente.' };
  }
}
