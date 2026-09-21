import { IsString, IsNumber, IsOptional, IsEnum, IsNotEmpty, Min } from 'class-validator';

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

  @IsString()
  @IsOptional()
  adminPassword?: string;
}