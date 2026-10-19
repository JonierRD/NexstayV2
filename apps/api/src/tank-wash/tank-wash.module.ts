import { Module } from '@nestjs/common';
import { TankWashService } from './tank-wash.service';
import { TankWashController } from './tank-wash.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditoriaModule } from '../auditoria/auditoria.module';

@Module({
  imports: [PrismaModule, AuditoriaModule],
  controllers: [TankWashController],
  providers: [TankWashService],
  exports: [TankWashService]
})
export class TankWashModule {}
