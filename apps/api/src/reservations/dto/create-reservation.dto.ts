import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength
} from 'class-validator';

export class CreateReservationDto {
  @IsString() @IsNotEmpty() cc!: string;
  @IsString() @MinLength(1) firstName!: string;
  @IsString() @MinLength(1) lastName!: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() cityOrigin?: string;
  @IsOptional() @IsString() cityDestination?: string;
  @IsOptional() @IsString() profession?: string;
  @IsOptional() @IsString() notes?: string;

  @IsString() @IsNotEmpty() roomNumber!: string;
  @IsString() @IsNotEmpty() checkIn!: string;
  @IsString() @IsNotEmpty() checkOut!: string;
  @IsEnum(['AIRE', 'VENTILADOR']) acTypeUsed!: 'AIRE' | 'VENTILADOR';
  @IsBoolean() paymentConfirmed!: boolean;
  @IsBoolean() cancellationPolicyAccepted!: boolean;
  @IsString() @IsNotEmpty() paymentMethod!: string;
  @IsOptional() @IsString() paymentReference?: string;
}

export class UpdateReservationDto {
  @IsOptional() @IsString() firstName?: string;
  @IsOptional() @IsString() lastName?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() cityOrigin?: string;
  @IsOptional() @IsString() cityDestination?: string;
  @IsOptional() @IsString() profession?: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsString() roomNumber?: string;
  @IsOptional() @IsString() checkIn?: string;
  @IsOptional() @IsString() checkOut?: string;
  @IsOptional() @IsEnum(['AIRE', 'VENTILADOR']) acTypeUsed?: 'AIRE' | 'VENTILADOR';
  @IsOptional() @IsBoolean() additionalPaymentConfirmed?: boolean;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) additionalPaymentAmount?: number;
  @IsOptional() @IsString() additionalPaymentMethod?: string;
  @IsOptional() @IsString() additionalPaymentReference?: string;
  @IsOptional() @IsBoolean() refundConfirmed?: boolean;
  @IsOptional() @IsString() refundMethod?: string;
  @IsOptional() @IsString() refundReference?: string;
}

export class CancelReservationDto {
  @IsOptional() @IsBoolean() forceWaiver?: boolean;
  @IsOptional() @IsString() forceReason?: string;
  @IsOptional() @IsString() confirmationText?: string;
  @IsOptional() @IsBoolean() refundConfirmed?: boolean;
  @IsOptional() @IsString() refundMethod?: string;
  @IsOptional() @IsString() refundReference?: string;
}
