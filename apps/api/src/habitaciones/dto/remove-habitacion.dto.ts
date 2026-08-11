import { IsOptional, IsString } from 'class-validator';

export class RemoveHabitacionDto {
  @IsOptional()
  @IsString()
  adminPassword?: string;
}
