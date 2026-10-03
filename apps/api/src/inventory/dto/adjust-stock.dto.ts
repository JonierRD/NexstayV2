import { Type } from 'class-transformer';
import { IsIn, IsInt, Min } from 'class-validator';

export class AdjustStockDto {
  @Type(() => Number)
  @IsInt({ message: 'La cantidad debe ser un número entero.' })
  @Min(1, { message: 'La cantidad debe ser mayor que cero.' })
  quantity!: number;

  @IsIn(['ADD', 'SUBTRACT'], { message: 'La operación debe ser ADD o SUBTRACT.' })
  operation!: 'ADD' | 'SUBTRACT';
}