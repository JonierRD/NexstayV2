ALTER TABLE "app_settings" ALTER COLUMN "tolerancia_checkout" SET DEFAULT 180;
UPDATE "app_settings" SET "tolerancia_checkout" = 180 WHERE "tolerancia_checkout" = 30;
ALTER TABLE "app_settings" ADD COLUMN IF NOT EXISTS "tarifa_excedente_checkout" INTEGER NOT NULL DEFAULT 10000;
