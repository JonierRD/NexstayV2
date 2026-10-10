import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Role } from '@prisma/client';
import { AuthService, type AuthResult } from './auth.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser } from './current-user.decorator';
import type { AuthenticatedUser, JwtPayload, PublicUser } from './auth.types';
import type { SeededAdmin } from './seed.service';
import { SeedService } from './seed.service';
import { AdminGuard } from './admin.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly seedService: SeedService
  ) {}

  @Post('login')
  login(@Body() loginDto: LoginDto): Promise<AuthResult> {
    return this.authService.login(loginDto);
  }

  @Post('register')
  @UseGuards(JwtAuthGuard, AdminGuard)
  register(@Body() registerDto: RegisterDto): Promise<AuthResult> {
    return this.authService.register(registerDto);
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
  @Patch('me')
  updateProfile(
    @CurrentUser() payload: JwtPayload,
    @Body() dto: UpdateProfileDto
  ): Promise<PublicUser> {
    return this.authService.updateProfile(payload, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('change-password')
  changePassword(
    @CurrentUser() payload: JwtPayload,
    @Body() dto: ChangePasswordDto
  ): Promise<{ message: string }> {
    return this.authService.changePassword(payload, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('verify-admin')
  verifyAdmin(): Promise<{ valid: boolean }> {
    return Promise.resolve({ valid: true });
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