import { Type } from 'class-transformer';
import { $Enums } from '@prisma/client';
import { IsWholePesos } from '../../common/is-whole-pesos';
import { IsDateString, IsEnum, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';

export class CreateFinanceMovementDto {
  @IsEnum($Enums.FinanceMovementType, { message: 'El tipo de movimiento no es válido.' })
  type!: $Enums.FinanceMovementType;

  @IsString()
  @MinLength(1, { message: 'La categoría es obligatoria.' })
  @MaxLength(60)
  category!: string;

  @IsString()
  @MinLength(1, { message: 'La descripción es obligatoria.' })
  @MaxLength(300)
  description!: string;

  @Type(() => Number)
  @IsWholePesos()
  @Min(1, { message: 'El valor debe ser mayor que cero.' })
  amount!: number;

  @IsOptional()
  @IsDateString({}, { message: 'La fecha del movimiento no es válida.' })
  date?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
