-- La columna quedó huérfana: el esquema y la app ya no usan la escala de fuente,
-- pero la migración original la había agregado a la BD.
ALTER TABLE "app_settings" DROP COLUMN "escala_fuente";
