import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { $Enums } from '@prisma/client';

export class CreateParkingSessionDto {
  @IsString()
  @MaxLength(12)
  licensePlate!: string;

  @IsString()
  @MaxLength(60)
  vehicleBrand!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  vehicleTypeId!: number;

  @IsEnum($Enums.ParkingBillingType)
  billingType!: $Enums.ParkingBillingType;

  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  clientFirstName!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  clientLastName!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  clientCc!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  phone!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
