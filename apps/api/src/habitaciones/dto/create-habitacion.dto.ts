import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString, Min, Matches, MaxLength } from 'class-validator';
import { RoomType } from '@prisma/client';

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
  @IsNumber()
  @Min(0)
  priceWithAir?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  priceWithFan?: number;

  @IsOptional()
  @IsString()
  @MaxLength(3000000) // 3MB
  @Matches(/^data:image\/(jpeg|png|gif|webp);base64,/)
  image?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  adminPassword?: string;
}
