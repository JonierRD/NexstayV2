import { Type } from 'class-transformer';
import { IsWholePesos } from '../../common/is-whole-pesos';
import { Min } from 'class-validator';

export class UpdateParkingRatesDto {
  @Type(() => Number)
  @IsWholePesos()
  @Min(1, { message: 'La tarifa por hora debe ser mayor que cero.' })
  motorcycleHourlyRate!: number;

  @Type(() => Number)
  @IsWholePesos()
  @Min(1, { message: 'La tarifa por hora debe ser mayor que cero.' })
  carHourlyRate!: number;
}