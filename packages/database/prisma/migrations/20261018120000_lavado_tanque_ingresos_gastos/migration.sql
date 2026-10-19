-- CreateEnum
CREATE TYPE "TankWashStatus" AS ENUM ('PENDIENTE', 'EN_PROCESO', 'COMPLETADO');

-- CreateEnum
CREATE TYPE "TankWashType" AS ENUM ('RESERVA', 'ELEVADO', 'SUBTERRANEO', 'OTRO');

-- CreateEnum
CREATE TYPE "FinanceMovementType" AS ENUM ('INGRESO', 'GASTO');

-- CreateTable
CREATE TABLE "lavado_tanque" (
    "id" SERIAL NOT NULL,
    "cliente" TEXT NOT NULL,
    "habitacion" TEXT,
    "tipo_tanque" "TankWashType" NOT NULL,
    "fecha_servicio" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "valor" DECIMAL(65,30) NOT NULL,
    "estado" "TankWashStatus" NOT NULL DEFAULT 'PENDIENTE',
    "notas" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lavado_tanque_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimientos_financieros" (
    "id" SERIAL NOT NULL,
    "tipo" "FinanceMovementType" NOT NULL,
    "categoria" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "valor" DECIMAL(65,30) NOT NULL,
    "fecha" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notas" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "movimientos_financieros_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "lavado_tanque_estado_fecha_servicio_idx" ON "lavado_tanque"("estado", "fecha_servicio");

-- CreateIndex
CREATE INDEX "movimientos_financieros_tipo_fecha_idx" ON "movimientos_financieros"("tipo", "fecha");
