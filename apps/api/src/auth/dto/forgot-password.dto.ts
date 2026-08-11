import { IsEmail } from 'class-validator';

export class ForgotPasswordDto {
  @IsEmail({}, { message: 'Ingresa un correo válido.' })
  email!: string;
}
