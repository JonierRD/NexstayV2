-- Repara bases donde las migraciones de reservas/pagos quedaron registradas
-- como aplicadas aunque sus objetos no llegaron a crearse.
DO $$ BEGIN
  CREATE TYPE "ReservationStatus" AS ENUM ('CONFIRMADA', 'CANCELADA', 'CHECKED_IN');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ReservationPaymentType" AS ENUM ('PAGO', 'DEVOLUCION');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "hospedajes" ADD COLUMN IF NOT EXISTS "reserva_id" INTEGER;

CREATE TABLE IF NOT EXISTS "reservas" (
  "id" SERIAL NOT NULL,
  "cliente_id" INTEGER NOT NULL,
  "habitacion_numero" TEXT NOT NULL,
  "fecha_ingreso" DATE NOT NULL,
  "fecha_salida" DATE NOT NULL,
  "noches" INTEGER NOT NULL,
  "precio_por_noche" DECIMAL(65,30) NOT NULL,
  "total" DECIMAL(65,30) NOT NULL,
  "tipo_aire_usado" "AcType" NOT NULL,
  "estado" "ReservationStatus" NOT NULL DEFAULT 'CONFIRMADA',
  "motivo_cancelacion" TEXT,
  "exoneracion_forzada" BOOLEAN NOT NULL DEFAULT false,
  "creado_por_id" TEXT NOT NULL,
  "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "actualizado_en" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "reservas_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "pagos_reserva" (
  "id" SERIAL NOT NULL,
  "reserva_id" INTEGER NOT NULL,
  "usuario_id" TEXT NOT NULL,
  "tipo" "ReservationPaymentType" NOT NULL,
  "monto" DECIMAL(65,30) NOT NULL,
  "metodo" TEXT NOT NULL,
  "referencia" TEXT,
  "nota" TEXT,
  "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "pagos_reserva_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "pagos_hospedaje" (
  "id" SERIAL NOT NULL,
  "hospedaje_id" INTEGER NOT NULL,
  "usuario_id" TEXT NOT NULL,
  "monto" DECIMAL(65,30) NOT NULL,
  "metodo" TEXT NOT NULL,
  "referencia" TEXT,
  "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "pagos_hospedaje_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "hospedajes_reserva_id_key"
  ON "hospedajes"("reserva_id");
CREATE INDEX IF NOT EXISTS "reservas_habitacion_numero_fecha_ingreso_fecha_salida_idx"
  ON "reservas"("habitacion_numero", "fecha_ingreso", "fecha_salida");
CREATE INDEX IF NOT EXISTS "reservas_estado_fecha_ingreso_idx"
  ON "reservas"("estado", "fecha_ingreso");
CREATE INDEX IF NOT EXISTS "pagos_reserva_reserva_id_creado_en_idx"
  ON "pagos_reserva"("reserva_id", "creado_en");
CREATE INDEX IF NOT EXISTS "pagos_hospedaje_hospedaje_id_creado_en_idx"
  ON "pagos_hospedaje"("hospedaje_id", "creado_en");

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'hospedajes_reserva_id_fkey' AND conrelid = 'hospedajes'::regclass) THEN
    ALTER TABLE "hospedajes" ADD CONSTRAINT "hospedajes_reserva_id_fkey"
      FOREIGN KEY ("reserva_id") REFERENCES "reservas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reservas_cliente_id_fkey' AND conrelid = 'reservas'::regclass) THEN
    ALTER TABLE "reservas" ADD CONSTRAINT "reservas_cliente_id_fkey"
      FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reservas_habitacion_numero_fkey' AND conrelid = 'reservas'::regclass) THEN
    ALTER TABLE "reservas" ADD CONSTRAINT "reservas_habitacion_numero_fkey"
      FOREIGN KEY ("habitacion_numero") REFERENCES "habitaciones"("numero") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reservas_creado_por_id_fkey' AND conrelid = 'reservas'::regclass) THEN
    ALTER TABLE "reservas" ADD CONSTRAINT "reservas_creado_por_id_fkey"
      FOREIGN KEY ("creado_por_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pagos_reserva_reserva_id_fkey' AND conrelid = 'pagos_reserva'::regclass) THEN
    ALTER TABLE "pagos_reserva" ADD CONSTRAINT "pagos_reserva_reserva_id_fkey"
      FOREIGN KEY ("reserva_id") REFERENCES "reservas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pagos_reserva_usuario_id_fkey' AND conrelid = 'pagos_reserva'::regclass) THEN
    ALTER TABLE "pagos_reserva" ADD CONSTRAINT "pagos_reserva_usuario_id_fkey"
      FOREIGN KEY ("usuario_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pagos_hospedaje_hospedaje_id_fkey' AND conrelid = 'pagos_hospedaje'::regclass) THEN
    ALTER TABLE "pagos_hospedaje" ADD CONSTRAINT "pagos_hospedaje_hospedaje_id_fkey"
      FOREIGN KEY ("hospedaje_id") REFERENCES "hospedajes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pagos_hospedaje_usuario_id_fkey' AND conrelid = 'pagos_hospedaje'::regclass) THEN
    ALTER TABLE "pagos_hospedaje" ADD CONSTRAINT "pagos_hospedaje_usuario_id_fkey"
      FOREIGN KEY ("usuario_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
