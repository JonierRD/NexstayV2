-- CreateTable
CREATE TABLE "app_settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "nombre_hotel" TEXT NOT NULL DEFAULT 'Hotel SAPAY',
    "nit" TEXT NOT NULL DEFAULT '',
    "direccion" TEXT NOT NULL DEFAULT '',
    "telefono" TEXT NOT NULL DEFAULT '',
    "correo" TEXT NOT NULL DEFAULT '',
    "logo" TEXT NOT NULL DEFAULT '',
    "tema" TEXT NOT NULL DEFAULT 'cafe',
    "modo_oscuro" BOOLEAN NOT NULL DEFAULT false,
    "hora_limite_checkout" TEXT NOT NULL DEFAULT '13:00',
    "tolerancia_checkout" INTEGER NOT NULL DEFAULT 30,
    "politica_cancelacion" TEXT NOT NULL DEFAULT '',
    "asistente_ia" BOOLEAN NOT NULL DEFAULT true,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_settings_pkey" PRIMARY KEY ("id")
);