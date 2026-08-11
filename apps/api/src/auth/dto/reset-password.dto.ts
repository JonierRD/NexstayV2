import { IsEmail, IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsEmail({}, { message: 'Ingresa un correo válido.' })
  email!: string;

  @IsString({ message: 'Ingresa el código de verificación.' })
  @MinLength(1, { message: 'Ingresa el código de verificación.' })
  code!: string;

  @IsString({ message: 'Ingresa una contraseña.' })
  @MinLength(5, { message: 'La contraseña debe tener al menos 5 caracteres.' })
  newPassword!: string;

  @IsString({ message: 'Confirma la contraseña.' })
  @MinLength(5, { message: 'Confirma la contraseña.' })
  confirmPassword!: string;
}
