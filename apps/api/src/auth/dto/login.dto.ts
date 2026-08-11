import { IsEnum, IsString, MinLength } from 'class-validator';
import { Role } from '@prisma/client';

export class LoginDto {
  @IsString({ message: 'Ingresa tu usuario.' })
  @MinLength(1, { message: 'Ingresa tu usuario.' })
  identifier!: string;

  @IsString({ message: 'Ingresa tu contraseña.' })
  @MinLength(1, { message: 'Ingresa tu contraseña.' })
  password!: string;

  @IsEnum(Role, { message: 'Selecciona un rol válido.' })
  role!: Role;
}