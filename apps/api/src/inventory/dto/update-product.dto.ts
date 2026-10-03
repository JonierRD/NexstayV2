import { Type } from 'class-transformer';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { IsWholePesos } from '../../common/is-whole-pesos';

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'El nombre del producto no puede quedar vacío.' })
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @Type(() => Number)
  @IsWholePesos()
  price?: number;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  category?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}