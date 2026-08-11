import { IsString, IsNumber, IsOptional, IsEnum, Min } from 'class-validator';

export class UpdateStayDto {
  @IsNumber()
  @IsOptional()
  @Min(1)
  nights?: number;

  @IsEnum(['AIRE', 'VENTILADOR'])
  @IsOptional()
  acTypeUsed?: 'AIRE' | 'VENTILADOR';

  @IsString()
  @IsOptional()
  adminPassword?: string;
}