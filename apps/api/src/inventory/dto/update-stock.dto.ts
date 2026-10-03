import { Type } from 'class-transformer';
import { IsInt, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class UpdateStockDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'La cantidad debe ser un número entero.' })
  @Min(0, { message: 'La cantidad no puede ser negativa.' })
  quantity?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El stock mínimo debe ser un número entero.' })
  @Min(0, { message: 'El stock mínimo no puede ser negativo.' })
  minStock?: number;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  location?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  status?: string;
}