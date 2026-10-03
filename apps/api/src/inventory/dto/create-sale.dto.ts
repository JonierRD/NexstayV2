import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class CreateSaleDto {
  @Type(() => Number)
  @IsInt({ message: 'El identificador del producto es inválido.' })
  @Min(1, { message: 'El identificador del producto es inválido.' })
  stockId!: number;

  @Type(() => Number)
  @IsInt({ message: 'La estancia seleccionada es inválida.' })
  @Min(1)
  stayId!: number;

  @Type(() => Number)
  @IsInt({ message: 'La cantidad debe ser un número entero.' })
  @Min(1, { message: 'La cantidad debe ser mayor que cero.' })
  quantity!: number;
}