import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { SeedService } from './seed.service';
import jwtConfig from './jwt.config';
import { MailModule } from '../mail/mail.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    MailModule,
    ConfigModule.forFeature(jwtConfig),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule.forFeature(jwtConfig)],
      inject: [ConfigService],
      useFactory: () => ({
        secret: process.env.JWT_SECRET ?? 'sapay-dev-secret-change-me',
        signOptions: { expiresIn: process.env.JWT_EXPIRES_IN ?? '12h' }
      })
    })
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, SeedService]
})
export class AuthModule {}