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
    Min
  } from 'class-validator';

export class UpdateLaundryDto {
  @IsOptional()
  @IsEnum($Enums.LaundryItem, { message: 'La prenda indicada no es válida.' })
  item?: $Enums.LaundryItem;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'La cantidad debe ser un número entero.' })
  @Min(1, { message: 'La cantidad debe ser mayor que cero.' })
  quantity?: number;

  @IsOptional()
  @Type(() => Number)
  @IsWholePesos()
  unitPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsWholePesos()
  totalPrice?: number;

  @IsOptional()
  @IsEnum($Enums.LaundryStatus, { message: 'El estado indicado no es válido.' })
  status?: $Enums.LaundryStatus;

  @IsOptional()
  @IsDateString({}, { message: 'La fecha de entrega no es válida.' })
  deliveryDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  clientName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  roomNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}