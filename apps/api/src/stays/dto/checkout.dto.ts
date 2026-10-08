import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CheckoutDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  nights?: number;

  @IsOptional()
  @IsBoolean()
  paymentConfirmed?: boolean;

  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @IsOptional()
  @IsString()
  paymentReference?: string;
}
