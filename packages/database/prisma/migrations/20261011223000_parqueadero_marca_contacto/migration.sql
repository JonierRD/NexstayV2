ALTER TABLE "movimientos_parqueadero"
ADD COLUMN "marca" TEXT NOT NULL DEFAULT 'No registrada';

UPDATE "movimientos_parqueadero"
SET "telefono" = 'No registrado'
WHERE "telefono" IS NULL;

ALTER TABLE "movimientos_parqueadero"
ALTER COLUMN "telefono" SET NOT NULL;
