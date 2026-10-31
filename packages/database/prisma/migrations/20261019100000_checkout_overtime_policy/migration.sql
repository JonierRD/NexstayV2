ALTER TABLE "app_settings" ALTER COLUMN "tolerancia_checkout" SET DEFAULT 180;
UPDATE "app_settings" SET "tolerancia_checkout" = 180 WHERE "tolerancia_checkout" = 30;
UPDATE "habitaciones" SET "estado" = 'DISPONIBLE' WHERE "estado" = 'RESERVADA';
