-- Libera habitaciones que quedaron marcadas como RESERVADA por reservas
-- futuras o canceladas. Solo debe permanecer RESERVADA la habitación que
-- tiene una reserva confirmada vigente para el día de hoy.
-- El "hoy" se evalúa en la zona horaria del hotel, no en la del servidor.
WITH hoy AS (
  SELECT (CURRENT_TIMESTAMP AT TIME ZONE 'America/Bogota')::date AS fecha
)
UPDATE "habitaciones" AS h
SET "estado" = 'DISPONIBLE'
FROM hoy
WHERE h."estado" = 'RESERVADA'
  AND NOT EXISTS (
    SELECT 1
    FROM "hospedajes" AS s
    WHERE s."habitacion_numero" = h."numero"
      AND s."estado" = 'ACTIVA'
  )
  AND NOT EXISTS (
    SELECT 1
    FROM "reservas" AS r
    WHERE r."habitacion_numero" = h."numero"
      AND r."estado" = 'CONFIRMADA'
      AND r."fecha_ingreso" <= hoy.fecha
      AND r."fecha_salida" > hoy.fecha
  );
