-- CreateEnum
CREATE TYPE "TurnoLabor" AS ENUM ('DIA', 'NOCHE');

-- CreateTable
CREATE TABLE "recepcionistas" (
    "id" SERIAL NOT NULL,
    "usuario_id" TEXT,
    "nombre" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "notas" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recepcionistas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "semanas" (
    "id" SERIAL NOT NULL,
    "fecha_inicio" DATE NOT NULL,
    "anio" INTEGER NOT NULL,
    "numero_semana" INTEGER NOT NULL,
    "notas" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "semanas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asignaciones_semanario" (
    "id" SERIAL NOT NULL,
    "semana_id" INTEGER NOT NULL,
    "fecha" DATE NOT NULL,
    "turno" "TurnoLabor" NOT NULL,
    "recepcionista_id" INTEGER NOT NULL,
    "destacado" BOOLEAN NOT NULL DEFAULT false,
    "nota" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "asignaciones_semanario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "recepcionistas_usuario_id_key" ON "recepcionistas"("usuario_id");

-- CreateIndex
CREATE UNIQUE INDEX "semanas_fecha_inicio_key" ON "semanas"("fecha_inicio");

-- CreateIndex
CREATE UNIQUE INDEX "asignaciones_semanario_semana_id_fecha_turno_key" ON "asignaciones_semanario"("semana_id", "fecha", "turno");

-- CreateIndex
CREATE INDEX "asignaciones_semanario_fecha_idx" ON "asignaciones_semanario"("fecha");

-- AddForeignKey
ALTER TABLE "recepcionistas" ADD CONSTRAINT "recepcionistas_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asignaciones_semanario" ADD CONSTRAINT "asignaciones_semanario_semana_id_fkey" FOREIGN KEY ("semana_id") REFERENCES "semanas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asignaciones_semanario" ADD CONSTRAINT "asignaciones_semanario_recepcionista_id_fkey" FOREIGN KEY ("recepcionista_id") REFERENCES "recepcionistas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;