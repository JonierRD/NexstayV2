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
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const jwt = config.getOrThrow<{ secret: string; expiresIn: string }>('jwt');
        return {
          secret: jwt.secret,
          signOptions: { expiresIn: jwt.expiresIn }
        };
      }
    })
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, SeedService]
})
export class AuthModule {}