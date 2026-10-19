import { Type } from 'class-transformer';
import { $Enums } from '@prisma/client';
import { IsWholePesos } from '../../common/is-whole-pesos';
import { IsDateString, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateTankWashDto {
  @IsString()
  @MinLength(1, { message: 'El nombre del cliente es obligatorio.' })
  @MaxLength(120)
  clientName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  roomNumber?: string;

  @IsEnum($Enums.TankWashType, { message: 'El tipo de tanque indicado no es válido.' })
  tankType!: $Enums.TankWashType;

  @IsOptional()
  @IsDateString({}, { message: 'La fecha del servicio no es válida.' })
  serviceDate?: string;

  @Type(() => Number)
  @IsWholePesos()
  amount!: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
