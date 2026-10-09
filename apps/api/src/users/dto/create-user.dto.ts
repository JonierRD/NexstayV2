import { Role } from '@prisma/client';
import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
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

  @IsEnum(Role, { message: 'Selecciona un rol válido.' })
  role!: Role;

  @IsString({ message: 'Ingresa una contraseña provisional.' })
  @MinLength(5, { message: 'La contraseña debe tener al menos 5 caracteres.' })
  initialPassword!: string;

  @IsString({ message: 'Confirma la contraseña provisional.' })
  @MinLength(5, { message: 'Confirma la contraseña provisional.' })
  confirmPassword!: string;
}