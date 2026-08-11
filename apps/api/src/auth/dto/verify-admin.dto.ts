import { IsString, MinLength } from 'class-validator';

export class VerifyAdminDto {
  @IsString()
  @MinLength(1)
  password!: string;
}
