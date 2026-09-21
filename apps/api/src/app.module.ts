import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { HabitacionesModule } from './habitaciones/habitaciones.module';
import { AuditoriaModule } from './auditoria/auditoria.module';
import { LaundryModule } from './laundry/laundry.module';
import { InventoryModule } from './inventory/inventory.module';
import { StaysModule } from './stays/stays.module';
import { ClientesModule } from './clientes/clientes.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env']
    }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),
    AuthModule,
    HabitacionesModule,
    AuditoriaModule,
    LaundryModule,
    InventoryModule,
    StaysModule,
    ClientesModule
  ],
  controllers: [AppController]
})
export class AppModule {}
