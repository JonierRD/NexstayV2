ALTER TYPE "LaundryStatus" RENAME TO "LaundryStatus_old";

CREATE TYPE "LaundryStatus" AS ENUM ('PENDIENTE', 'ENTREGADO');

ALTER TABLE "lavanderia"
ALTER COLUMN "estado" DROP DEFAULT;

ALTER TABLE "lavanderia"
ALTER COLUMN "estado" TYPE "LaundryStatus"
USING CASE
  WHEN "estado"::text = 'ENTREGADO' THEN 'ENTREGADO'::"LaundryStatus"
  ELSE 'PENDIENTE'::"LaundryStatus"
END;

DROP TYPE "LaundryStatus_old";

ALTER TABLE "lavanderia"
ALTER COLUMN "estado" SET DEFAULT 'PENDIENTE';