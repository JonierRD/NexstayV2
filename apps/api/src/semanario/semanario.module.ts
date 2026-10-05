import { Module } from '@nestjs/common';
import { SemanarioService } from './semanario.service';
import { SemanarioController } from './semanario.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditoriaModule } from '../auditoria/auditoria.module';

@Module({
  imports: [PrismaModule, AuditoriaModule],
  controllers: [SemanarioController],
  providers: [SemanarioService],
  exports: [SemanarioService]
})
export class SemanarioModule {}