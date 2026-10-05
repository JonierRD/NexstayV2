import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateRecepcionistaDto {
  @IsString({ message: 'El nombre es obligatorio.' })
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres.' })
  @MaxLength(80, { message: 'El nombre no puede superar los 80 caracteres.' })
  nombre!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'La nota no puede superar los 500 caracteres.' })
  notas?: string;
}