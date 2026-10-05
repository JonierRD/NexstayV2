import { Type } from 'class-transformer';
import { $Enums } from '@prisma/client';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min
} from 'class-validator';

export class CeldaDto {
  @Type(() => Number)
  @IsInt({ message: 'La semana debe ser un identificador válido.' })
  @Min(1, { message: 'La semana debe ser un identificador válido.' })
  semanaId!: number;

  @IsDateString({}, { message: 'La fecha de la celda no es válida.' })
  fecha!: string;

  @IsEnum($Enums.TurnoLabor, { message: 'El turno indicado no es válido.' })
  turno!: $Enums.TurnoLabor;

  @Type(() => Number)
  @IsInt({ message: 'La recepcionista debe ser un identificador válido.' })
  @Min(1, { message: 'La recepcionista debe ser un identificador válido.' })
  recepcionistaId!: number;

  @IsOptional()
  @IsBoolean({ message: 'El destacado debe ser verdadero o falso.' })
  destacado?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(300, { message: 'La nota no puede superar los 300 caracteres.' })
  nota?: string;
}

/** Va por query string: identifica la celda a borrar (día + turno). */
export class CeldaQueryDto {
  @Type(() => Number)
  @IsInt({ message: 'La semana debe ser un identificador válido.' })
  @Min(1, { message: 'La semana debe ser un identificador válido.' })
  semanaId!: number;

  @IsDateString({}, { message: 'La fecha de la celda no es válida.' })
  fecha!: string;

  @IsEnum($Enums.TurnoLabor, { message: 'El turno indicado no es válido.' })
  turno!: $Enums.TurnoLabor;
}