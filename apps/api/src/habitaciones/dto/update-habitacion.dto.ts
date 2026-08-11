import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString, Min, Matches, MaxLength } from 'class-validator';
import { RoomStatus, RoomType } from '@prisma/client';

export class UpdateHabitacionDto {
  @IsOptional()
  @IsEnum(RoomType)
  type?: RoomType;

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
  @IsEnum(RoomStatus)
  status?: RoomStatus;

  @IsOptional()
  @IsString()
  @MaxLength(3000000) // 3MB
  @Matches(/^data:image\/(jpeg|png|gif|webp);base64,/)
  image?: string | null;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  adminPassword?: string;
}
