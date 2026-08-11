import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { HabitacionesController } from './habitaciones.controller';
import { HabitacionesService } from './habitaciones.service';
import { AuditoriaModule } from '../auditoria/auditoria.module';

@Module({
  imports: [PrismaModule, AuditoriaModule],
  controllers: [HabitacionesController],
  providers: [HabitacionesService]
})
export class HabitacionesModule {}
