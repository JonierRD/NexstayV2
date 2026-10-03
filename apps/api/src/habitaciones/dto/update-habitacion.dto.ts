import { IsBoolean, IsEnum, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { RoomStatus, RoomType } from '@prisma/client';
import { IsWholePesos } from '../../common/is-whole-pesos';
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
  @IsWholePesos()
  priceWithAir?: number;
  @IsOptional()
  @IsWholePesos()
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
}
