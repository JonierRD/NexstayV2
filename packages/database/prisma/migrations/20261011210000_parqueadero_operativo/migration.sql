CREATE TYPE "ParkingBillingType" AS ENUM ('DIARIO', 'MENSUAL');
CREATE TYPE "ParkingStatus" AS ENUM ('ACTIVO', 'CERRADO');

CREATE TABLE "tipos_vehiculo_parqueadero" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "tarifa_diaria" DECIMAL(65,30) NOT NULL,
    "tarifa_mensual" DECIMAL(65,30) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "tipos_vehiculo_parqueadero_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "movimientos_parqueadero" (
    "id" SERIAL NOT NULL,
    "placa" TEXT NOT NULL,
    "marca" TEXT NOT NULL,
    "tipo_vehiculo_id" INTEGER NOT NULL,
    "tipo_cobro" "ParkingBillingType" NOT NULL,
    "estado" "ParkingStatus" NOT NULL DEFAULT 'ACTIVO',
    "ingreso" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "salida" TIMESTAMP(3),
    "cliente" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "es_huesped" BOOLEAN NOT NULL DEFAULT false,
    "hospedaje_id" INTEGER,
    "tarifa_aplicada" DECIMAL(65,30) NOT NULL,
    "valor" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "pagado" BOOLEAN NOT NULL DEFAULT false,
    "notas" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "movimientos_parqueadero_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "tipos_vehiculo_parqueadero_nombre_key" ON "tipos_vehiculo_parqueadero"("nombre");
CREATE INDEX "movimientos_parqueadero_estado_ingreso_idx" ON "movimientos_parqueadero"("estado", "ingreso");
CREATE INDEX "movimientos_parqueadero_placa_estado_idx" ON "movimientos_parqueadero"("placa", "estado");
CREATE UNIQUE INDEX "movimientos_parqueadero_placa_activa_key" ON "movimientos_parqueadero"("placa") WHERE "estado" = 'ACTIVO';
ALTER TABLE "movimientos_parqueadero" ADD CONSTRAINT "movimientos_parqueadero_tipo_vehiculo_id_fkey" FOREIGN KEY ("tipo_vehiculo_id") REFERENCES "tipos_vehiculo_parqueadero"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "movimientos_parqueadero" ADD CONSTRAINT "movimientos_parqueadero_hospedaje_id_fkey" FOREIGN KEY ("hospedaje_id") REFERENCES "hospedajes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
