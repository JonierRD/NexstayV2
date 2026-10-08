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

CREATE INDEX IF NOT EXISTS "pagos_hospedaje_hospedaje_id_creado_en_idx"
  ON "pagos_hospedaje"("hospedaje_id", "creado_en");

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'pagos_hospedaje_hospedaje_id_fkey'
      AND conrelid = 'pagos_hospedaje'::regclass
  ) THEN
    ALTER TABLE "pagos_hospedaje"
      ADD CONSTRAINT "pagos_hospedaje_hospedaje_id_fkey"
      FOREIGN KEY ("hospedaje_id") REFERENCES "hospedajes"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'pagos_hospedaje_usuario_id_fkey'
      AND conrelid = 'pagos_hospedaje'::regclass
  ) THEN
    ALTER TABLE "pagos_hospedaje"
      ADD CONSTRAINT "pagos_hospedaje_usuario_id_fkey"
      FOREIGN KEY ("usuario_id") REFERENCES "users"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
