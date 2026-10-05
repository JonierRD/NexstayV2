import { Type } from 'class-transformer';
import { $Enums } from '@prisma/client';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested
} from 'class-validator';

export class AsignacionInputDto {
  @IsDateString({}, { message: 'La fecha de la asignación no es válida.' })
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

/** Reemplaza por completo las asignaciones de una semana (máximo 7 días × 2 turnos). */
export class GuardarSemanaDto {
  @Type(() => Number)
  @IsInt({ message: 'La semana debe ser un identificador válido.' })
  @Min(1, { message: 'La semana debe ser un identificador válido.' })
  semanaId!: number;

  @IsArray()
  @ArrayMaxSize(14, { message: 'Una semana no puede tener más de 14 asignaciones.' })
  @ValidateNested({ each: true })
  @Type(() => AsignacionInputDto)
  asignaciones!: AsignacionInputDto[];
}