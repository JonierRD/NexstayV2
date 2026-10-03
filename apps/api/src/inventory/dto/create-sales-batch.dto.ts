import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsInt, IsOptional, IsString, MaxLength, Min, ValidateNested } from 'class-validator';

export class BatchSaleItemDto {
  @Type(() => Number)
  @IsInt({ message: 'El identificador del producto es inválido.' })
  @Min(1, { message: 'El identificador del producto es inválido.' })
  stockId!: number;

  @Type(() => Number)
  @IsInt({ message: 'La cantidad debe ser un número entero.' })
  @Min(1, { message: 'La cantidad de cada producto debe ser mayor que cero.' })
  quantity!: number;
}

export class CreateSalesBatchDto {
  @IsArray()
  @ArrayMinSize(1, { message: 'Debe indicar al menos un producto para la venta' })
  @ValidateNested({ each: true })
  @Type(() => BatchSaleItemDto)
  items!: BatchSaleItemDto[];

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'La estancia seleccionada es inválida.' })
  @Min(1)
  stayId?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  customerName?: string | null;
}