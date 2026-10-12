import { Type } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { IsWholePesos } from '../../common/is-whole-pesos';

export class UpdateVehicleTypeDto {
  @IsOptional()
  @IsString()
  @MaxLength(60)
  name?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsWholePesos()
  dailyRate?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsWholePesos()
  monthlyRate?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
