import { Type } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, MaxLength, Min, IsNumber } from 'class-validator';
import { IsWholePesos } from '../../common/is-whole-pesos';

export class CreateVehicleTypeDto {
  @IsString()
  @MaxLength(60)
  name!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsWholePesos()
  dailyRate!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsWholePesos()
  monthlyRate!: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
