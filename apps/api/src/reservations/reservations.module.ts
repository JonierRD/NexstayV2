import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditoriaModule } from '../auditoria/auditoria.module';
import { StaysModule } from '../stays/stays.module';
import { ReservationsController } from './reservations.controller';
import { ReservationsService } from './reservations.service';

@Module({
  imports: [PrismaModule, AuditoriaModule, StaysModule],
  controllers: [ReservationsController],
  providers: [ReservationsService]
})
export class ReservationsModule {}
