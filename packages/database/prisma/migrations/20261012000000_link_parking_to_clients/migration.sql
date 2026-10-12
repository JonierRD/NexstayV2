ALTER TABLE "movimientos_parqueadero"
ADD COLUMN "cliente_id" INTEGER;

CREATE INDEX "movimientos_parqueadero_cliente_id_idx"
ON "movimientos_parqueadero"("cliente_id");

ALTER TABLE "movimientos_parqueadero"
ADD CONSTRAINT "movimientos_parqueadero_cliente_id_fkey"
FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;
