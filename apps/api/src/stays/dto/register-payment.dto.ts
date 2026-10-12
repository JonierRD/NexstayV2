import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';

export class RegisterStayPaymentDto {
  @Type(() => Number)
  @IsNumber({}, { message: 'El monto del pago debe ser un número.' })
  @Min(1, { message: 'El monto del pago debe ser mayor que cero.' })
  amount!: number;

  @IsString({ message: 'Selecciona un método de pago.' })
  @MinLength(1, { message: 'Selecciona un método de pago.' })
  @MaxLength(40, { message: 'El método de pago es demasiado largo.' })
  method!: string;

  @IsOptional()
  @IsString({ message: 'La referencia no es válida.' })
  @MaxLength(80, { message: 'La referencia es demasiado larga.' })
  reference?: string;
}
