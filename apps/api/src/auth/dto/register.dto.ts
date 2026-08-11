import { Role } from '@prisma/client';
import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString({ message: 'Ingresa el nombre completo.' })
  @MinLength(1, { message: 'Ingresa el nombre completo.' })
  fullName!: string;

  @IsString({ message: 'Ingresa la cédula.' })
  @MinLength(1, { message: 'Ingresa la cédula.' })
  cc!: string;

  @IsEmail({}, { message: 'Ingresa un correo válido.' })
  email!: string;

  @IsOptional()
  @IsString({ message: 'Ingresa un teléfono válido.' })
  phone?: string;

  @IsString({ message: 'Ingresa una contraseña.' })
  @MinLength(5, { message: 'La contraseña debe tener al menos 5 caracteres.' })
  password!: string;

  @IsString({ message: 'Confirma la contraseña.' })
  @MinLength(5, { message: 'Confirma la contraseña.' })
  confirmPassword!: string;

  @IsEnum(Role, { message: 'Selecciona un rol válido.' })
  role!: Role;

  @IsString({ message: 'Ingresa la contraseña del administrador que autoriza el registro.' })
  @MinLength(1, { message: 'Ingresa la contraseña del administrador que autoriza el registro.' })
  adminPassword!: string;
}