import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsEmail({}, { message: 'Ingresa un correo electrónico válido.' })
  @MaxLength(180, { message: 'El correo electrónico es demasiado largo.' })
  email?: string;

  @IsOptional()
  @IsString({ message: 'Ingresa el nombre completo.' })
  @MinLength(1, { message: 'Ingresa el nombre completo.' })
  @MaxLength(120, { message: 'El nombre completo es demasiado largo.' })
  fullName?: string;

  @IsOptional()
  @IsString({ message: 'Ingresa un teléfono válido.' })
  @MaxLength(30, { message: 'El teléfono es demasiado largo.' })
  phone?: string;
}