import { Module } from '@nestjs/common';
import { AuditoriaModule } from '../auditoria/auditoria.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ParkingController } from './parking.controller';
import { ParkingService } from './parking.service';

@Module({
  imports: [PrismaModule, AuditoriaModule],
  controllers: [ParkingController],
  providers: [ParkingService],
  exports: [ParkingService]
})
export class ParkingModule {}