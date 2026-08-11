import { Module } from '@nestjs/common';
import { StaysController } from './stays.controller';
import { StaysService } from './stays.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditoriaModule } from '../auditoria/auditoria.module';

@Module({
  imports: [PrismaModule, AuditoriaModule],
  controllers: [StaysController],
  providers: [StaysService],
  exports: [StaysService]
})
export class StaysModule {}