import { Role } from '@prisma/client';
import { IsBoolean, IsEmail, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

/**
 * El administrador edita datos del usuario pero NUNCA su contraseña: el cambio
 * de contraseña es decisión del propio usuario (desde Perfil / restablecimiento).
 */
export class UpdateUserDto {
  @IsOptional()
  @IsString({ message: 'Ingresa el nombre completo.' })
  @MinLength(1, { message: 'Ingresa el nombre completo.' })
  @MaxLength(120, { message: 'El nombre completo es demasiado largo.' })
  fullName?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Ingresa un correo válido.' })
  @MaxLength(180, { message: 'El correo es demasiado largo.' })
  email?: string;

  @IsOptional()
  @IsString({ message: 'Ingresa un teléfono válido.' })
  @MaxLength(30, { message: 'El teléfono es demasiado largo.' })
  phone?: string;

  @IsOptional()
  @IsEnum(Role, { message: 'Selecciona un rol válido.' })
  role?: Role;

  @IsOptional()
  @IsBoolean({ message: 'El estado debe ser verdadero o falso.' })
  isActive?: boolean;
}