import { IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsString({ message: 'Ingresa tu contraseña actual.' })
  @MinLength(1, { message: 'Ingresa tu contraseña actual.' })
  currentPassword!: string;

  @IsString({ message: 'Ingresa una contraseña nueva.' })
  @MinLength(5, { message: 'La contraseña debe tener al menos 5 caracteres.' })
  newPassword!: string;

  @IsString({ message: 'Confirma la contraseña nueva.' })
  @MinLength(5, { message: 'Confirma la contraseña nueva.' })
  confirmPassword!: string;
}