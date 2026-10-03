import { Type } from 'class-transformer';
import { $Enums } from '@prisma/client';
import { IsWholePesos } from '../../common/is-whole-pesos';
import {
    IsDateString,
    IsEnum,
    IsInt,
    IsOptional,
    IsString,
    MaxLength,
    Min,
    MinLength
  } from 'class-validator';

export class CreateLaundryDto {
  @IsEnum($Enums.LaundryItem, { message: 'La prenda indicada no es válida.' })
  item!: $Enums.LaundryItem;

  @IsString()
  @MaxLength(500)
  description!: string;

  @Type(() => Number)
  @IsInt({ message: 'La cantidad debe ser un número entero.' })
  @Min(1, { message: 'La cantidad debe ser mayor que cero.' })
  quantity!: number;

  @Type(() => Number)
  @IsWholePesos()
  unitPrice!: number;

  @Type(() => Number)
  @IsWholePesos()
  totalPrice!: number;

  @IsOptional()
  @IsDateString({}, { message: 'La fecha de entrega no es válida.' })
  deliveryDate?: string;

  @IsString()
  @MinLength(1, { message: 'El nombre del cliente es obligatorio.' })
  @MaxLength(120)
  clientName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  roomNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}