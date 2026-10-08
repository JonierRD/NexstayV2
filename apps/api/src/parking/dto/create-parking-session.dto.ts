import { $Enums } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateParkingSessionDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  ownerName!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(30)
  ownerCc!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(10)
  licensePlate!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(80)
  phone!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(80)
  vehicleLine!: string;

  @IsEnum($Enums.VehicleType)
  vehicleType!: $Enums.VehicleType;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}