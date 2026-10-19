import { Module } from '@nestjs/common';
import { StaysController } from './stays.controller';
import { StaysService } from './stays.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditoriaModule } from '../auditoria/auditoria.module';
import { FinanceModule } from '../finance/finance.module';

@Module({
  imports: [PrismaModule, AuditoriaModule, FinanceModule],
  controllers: [StaysController],
  providers: [StaysService],
  exports: [StaysService]
})
export class StaysModule {}