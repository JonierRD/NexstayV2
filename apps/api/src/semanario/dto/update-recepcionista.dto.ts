import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';

export class UpdateRecepcionistaDto {
  @IsOptional()
  @IsString({ message: 'El nombre es obligatorio.' })
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres.' })
  @MaxLength(80, { message: 'El nombre no puede superar los 80 caracteres.' })
  nombre?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El orden debe ser un número entero.' })
  @Min(0, { message: 'El orden no puede ser negativo.' })
  orden?: number;

  // Viene de un <select> del formulario, asi que puede llegar como "true"/"false".
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean({ message: 'El estado activo debe ser verdadero o falso.' })
  activo?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'La nota no puede superar los 500 caracteres.' })
  notas?: string;
}