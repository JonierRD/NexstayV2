CREATE TYPE "ParkingSessionStatus" AS ENUM ('EN_CURSO', 'PENDIENTE_PAGO', 'PAGADO', 'EXONERADO');

CREATE TABLE "tarifas_parqueadero" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "tarifa_moto_hora" DECIMAL(65,30) NOT NULL DEFAULT 1000,
    "tarifa_carro_hora" DECIMAL(65,30) NOT NULL DEFAULT 2000,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tarifas_parqueadero_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "parqueadero_sesiones" (
    "id" SERIAL NOT NULL,
    "propietario" TEXT NOT NULL,
    "cedula" TEXT NOT NULL,
    "placa" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "linea" TEXT NOT NULL,
    "tipo_vehiculo" "VehicleType" NOT NULL,
    "entrada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "salida" TIMESTAMP(3),
    "tarifa_hora" DECIMAL(65,30) NOT NULL,
    "horas_cobradas" INTEGER,
    "total" DECIMAL(65,30),
    "estado" "ParkingSessionStatus" NOT NULL DEFAULT 'EN_CURSO',
    "hospedado_al_ingreso" BOOLEAN NOT NULL DEFAULT false,
    "fecha_pago" TIMESTAMP(3),
    "notas" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parqueadero_sesiones_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "parqueadero_sesiones_placa_estado_idx" ON "parqueadero_sesiones"("placa", "estado");
CREATE INDEX "parqueadero_sesiones_cedula_entrada_idx" ON "parqueadero_sesiones"("cedula", "entrada");