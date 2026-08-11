import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class CheckoutDto {
  @IsString()
  @IsOptional()
  adminPassword?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}