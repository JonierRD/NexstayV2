import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength
} from 'class-validator';

export const THEME_COLORS = ['cafe', 'verde', 'azul'] as const;
export type ThemeColor = (typeof THEME_COLORS)[number];

export class UpdateSettingsDto {
  @IsOptional()
  @IsString({ message: 'Ingresa el nombre del hotel.' })
  @MinLength(1, { message: 'Ingresa el nombre del hotel.' })
  @MaxLength(120, { message: 'El nombre del hotel es demasiado largo.' })
  hotelName?: string;

  @IsOptional()
  @IsString({ message: 'Ingresa el NIT válido.' })
  @MaxLength(40, { message: 'El NIT es demasiado largo.' })
  hotelNit?: string;

  @IsOptional()
  @IsString({ message: 'Ingresa una dirección válida.' })
  @MaxLength(200, { message: 'La dirección es demasiado larga.' })
  hotelAddress?: string;

  @IsOptional()
  @IsString({ message: 'Ingresa un teléfono válido.' })
  @MaxLength(30, { message: 'El teléfono es demasiado largo.' })
  hotelPhone?: string;

  @IsOptional()
  @IsString({ message: 'Ingresa un correo válido.' })
  @MaxLength(180, { message: 'El correo es demasiado largo.' })
  hotelEmail?: string;

  @IsOptional()
  @IsString({ message: 'El logo no es válido.' })
  @MaxLength(5_000_000, { message: 'El logo es demasiado grande.' })
  logoDataUrl?: string;

  @IsOptional()
  @IsIn(THEME_COLORS, { message: 'Selecciona un tema válido.' })
  themeColor?: ThemeColor;

  @IsOptional()
  @IsBoolean({ message: 'El modo oscuro debe ser verdadero o falso.' })
  darkMode?: boolean;

  @IsOptional()
  @IsString({ message: 'Ingresa la hora de check-in.' })
  @MaxLength(5, { message: 'La hora de check-in debe tener formato HH:mm.' })
  checkinLimit?: string;

  @IsOptional()
  @IsString({ message: 'Ingresa la hora límite de salida.' })
  @MaxLength(5, { message: 'La hora límite debe tener formato HH:mm.' })
  checkoutLimit?: string;

  @IsOptional()
  @IsInt({ message: 'La tolerancia de salida debe ser un número.' })
  @Min(0, { message: 'La tolerancia de salida no puede ser negativa.' })
  checkoutTolerance?: number;

  @IsOptional()
  @IsString({ message: 'Ingresa una política de cancelación válida.' })
  @MaxLength(2000, { message: 'La política de cancelación es demasiado larga.' })
  cancellationPolicy?: string;

  @IsOptional()
  @IsBoolean({ message: 'El asistente IA debe ser verdadero o falso.' })
  aiEnabled?: boolean;
}