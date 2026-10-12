import { IsString, IsNumber, IsOptional, IsEnum, IsNotEmpty, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
export class CheckinDto {
  // Datos del cliente (obligatorios: cc, firstName, lastName)
  @IsString()
  @IsNotEmpty()
  cc!: string;
  @IsString()
  @IsOptional()
  firstName?: string;
  @IsString()
  @IsOptional()
  lastName?: string;
  @IsString()
  @IsOptional()
  phone?: string;
  @IsString()
  @IsOptional()
  cityOrigin?: string;
  @IsString()
  @IsOptional()
  cityDestination?: string;
  @IsString()
  @IsOptional()
  profession?: string;
  @IsString()
  @IsOptional()
  notes?: string;
  // Datos del hospedaje
  @IsString()
  @IsNotEmpty()
  roomNumber!: string;
  @IsEnum(['AIRE', 'VENTILADOR'])
  @IsNotEmpty()
  acType!: 'AIRE' | 'VENTILADOR';
  @IsNumber()
  @IsOptional()
  @Min(1)
  nights?: number;
  @IsString()
  @IsOptional()
  checkIn?: string;
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  reservationId?: number;
}
