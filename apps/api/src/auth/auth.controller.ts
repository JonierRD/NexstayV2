import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyAdminDto } from './dto/verify-admin.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser } from './current-user.decorator';
import type { AuthenticatedUser, JwtPayload } from './auth.types';
import type { SeededAdmin } from './seed.service';
import { SeedService } from './seed.service';

type AuthResultDto = {
  token: string;
  expiresIn: number;
  user: unknown;
};

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly seedService: SeedService
  ) {}

  @Post('login')
  login(@Body() loginDto: LoginDto): Promise<AuthResultDto> {
    return this.authService.login(loginDto) as unknown as Promise<AuthResultDto>;
  }

  @Post('register')
  register(@Body() registerDto: RegisterDto): Promise<AuthResultDto> {
    return this.authService.register(registerDto) as unknown as Promise<AuthResultDto>;
  }

  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto): Promise<{ message: string }> {
    return this.authService.forgotPassword(dto);
  }

  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto): Promise<{ message: string }> {
    return this.authService.resetPassword(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@CurrentUser() payload: JwtPayload): Promise<AuthenticatedUser> {
    return this.authService.me(payload);
  }

  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('verify-admin')
  verifyAdmin(@Body() dto: VerifyAdminDto): Promise<{ valid: boolean }> {
    return this.authService.verifyAdminPassword(dto.password);
  }

  @Get('first-run')
  firstRun(): { pending: boolean; admin?: SeededAdmin } {
    const admin = this.seedService.getSeededCredentials();
    if (!admin) {
      return { pending: false };
    }
    return { pending: true, admin };
  }
}