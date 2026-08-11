import { IsString, IsOptional } from 'class-validator';

export class UpdateClienteDto {
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

  @IsString()
  @IsOptional()
  adminPassword?: string;
}