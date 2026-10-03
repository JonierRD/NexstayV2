import { IsBoolean, IsEnum, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { RoomType } from '@prisma/client';
import { IsWholePesos } from '../../common/is-whole-pesos';
export class CreateHabitacionDto {
  @IsString()
  @Matches(/^\d{3,4}$/, {
    message: 'El número de habitación debe ser de 3 a 4 dígitos numéricos.'
  })
  number!: string;
  @IsEnum(RoomType)
  type!: RoomType;
  @IsOptional()
  @IsBoolean()
  hasAir?: boolean;
  @IsOptional()
  @IsBoolean()
  hasFan?: boolean;
  @IsOptional()
  @IsWholePesos()
  priceWithAir?: number;
  @IsOptional()
  @IsWholePesos()
  priceWithFan?: number;
  @IsOptional()
  @IsString()
  @MaxLength(3000000) // 3MB
  @Matches(/^data:image\/(jpeg|png|gif|webp);base64,/)
  image?: string;
  @IsOptional()
  @IsString()
  notes?: string;
}
