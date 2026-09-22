-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'RECEPTION');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'CHECK_IN', 'CHECK_OUT', 'STATUS_CHANGE');

-- CreateEnum
CREATE TYPE "RoomType" AS ENUM ('DOSCAMAS', 'MATRIMONIAL', 'SENCILLA');

-- CreateEnum
CREATE TYPE "RoomStatus" AS ENUM ('DISPONIBLE', 'OCUPADA', 'RESERVADA', 'MANTENIMIENTO');

-- CreateEnum
CREATE TYPE "StayStatus" AS ENUM ('ACTIVA', 'FINALIZADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "AcType" AS ENUM ('AIRE', 'VENTILADOR');

-- CreateEnum
CREATE TYPE "VehicleType" AS ENUM ('MOTO', 'CARRO', 'CAMIONETA', 'CAMION_LIVIANO', 'PESADO');

-- CreateEnum
CREATE TYPE "SaleType" AS ENUM ('CONTADO', 'FIADO');

-- CreateEnum
CREATE TYPE "ShiftStatus" AS ENUM ('ACTIVO', 'CERRADO');

-- CreateEnum
CREATE TYPE "LaundryStatus" AS ENUM ('PENDIENTE', 'EN_PROCESO', 'LISTO', 'ENTREGADO');

-- CreateEnum
CREATE TYPE "LaundryItem" AS ENUM ('CAMISA', 'PANTALON', 'TOALLA', 'SABANA', 'FUNDAS_ALMOHADA', 'EDREDON', 'OTRO');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "cc" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "passwordHash" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "resetToken" TEXT,
    "resetTokenExpiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clientes" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "cedula" TEXT NOT NULL,
    "telefono" TEXT,
    "ciudad_origen" TEXT,
    "ciudad_destino" TEXT,
    "profesion" TEXT,
    "notas" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "habitaciones" (
    "numero" TEXT NOT NULL,
    "tipo" "RoomType" NOT NULL,
    "tiene_aire" BOOLEAN NOT NULL DEFAULT false,
    "tiene_ventilador" BOOLEAN NOT NULL DEFAULT false,
    "precio_con_aire" DECIMAL(65,30),
    "precio_con_ventilador" DECIMAL(65,30),
    "estado" "RoomStatus" NOT NULL DEFAULT 'DISPONIBLE',
    "imagen" TEXT,
    "notas" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "habitaciones_pkey" PRIMARY KEY ("numero")
);

-- CreateTable
CREATE TABLE "hospedajes" (
    "id" SERIAL NOT NULL,
    "cliente_id" INTEGER NOT NULL,
    "habitacion_numero" TEXT NOT NULL,
    "fecha_ingreso" TIMESTAMP(3) NOT NULL,
    "fecha_salida" TIMESTAMP(3),
    "noches" INTEGER NOT NULL,
    "precio_por_noche" DECIMAL(65,30) NOT NULL,
    "total" DECIMAL(65,30) NOT NULL,
    "tipo_aire_usado" "AcType" NOT NULL,
    "estado" "StayStatus" NOT NULL DEFAULT 'ACTIVA',
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hospedajes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "productos" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "precio" DECIMAL(65,30) NOT NULL,
    "categoria" TEXT NOT NULL DEFAULT 'TIENDA',
    "descripcion" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "productos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventario" (
    "id" SERIAL NOT NULL,
    "producto_id" INTEGER NOT NULL,
    "cantidad" INTEGER NOT NULL DEFAULT 0,
    "stock_minimo" INTEGER NOT NULL DEFAULT 0,
    "ubicacion" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'NUEVO',
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ventas" (
    "id" SERIAL NOT NULL,
    "producto_id" INTEGER NOT NULL,
    "hospedaje_id" INTEGER,
    "fecha" TIMESTAMP(3) NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "precio_unitario" DECIMAL(65,30) NOT NULL,
    "tipo" "SaleType" NOT NULL DEFAULT 'CONTADO',
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ventas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "abonos" (
    "id" SERIAL NOT NULL,
    "venta_id" INTEGER NOT NULL,
    "monto" DECIMAL(65,30) NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "abonos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "turnos" (
    "id" SERIAL NOT NULL,
    "recepcionista_inicio_id" TEXT NOT NULL,
    "recepcionista_fin_id" TEXT,
    "inicio" TIMESTAMP(3) NOT NULL,
    "fin" TIMESTAMP(3),
    "base_dinero" DECIMAL(65,30) NOT NULL,
    "novedades" TEXT,
    "firma_inicio" TEXT,
    "firma_fin" TEXT,
    "estado" "ShiftStatus" NOT NULL DEFAULT 'ACTIVO',
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "turnos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parqueadero_mensual" (
    "id" SERIAL NOT NULL,
    "fecha_ingreso" TIMESTAMP(3) NOT NULL,
    "propietario" TEXT NOT NULL,
    "placa" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "linea" TEXT NOT NULL,
    "tipo_vehiculo" "VehicleType" NOT NULL,
    "valor_mensual" DECIMAL(65,30) NOT NULL,
    "notas" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parqueadero_mensual_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagos_parqueadero" (
    "id" SERIAL NOT NULL,
    "parqueadero_id" INTEGER NOT NULL,
    "mes" INTEGER NOT NULL,
    "anio" INTEGER NOT NULL,
    "valor_pagado" DECIMAL(65,30) NOT NULL,
    "fecha_pago" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notas" TEXT,

    CONSTRAINT "pagos_parqueadero_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "logs_auditoria" (
    "id" SERIAL NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "accion" "AuditAction" NOT NULL,
    "entidad" TEXT NOT NULL,
    "entidad_id" TEXT,
    "valor_anterior" TEXT,
    "valor_nuevo" TEXT,
    "descripcion" TEXT NOT NULL,
    "ip_address" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "logs_auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lavanderia" (
    "id" SERIAL NOT NULL,
    "tipo_prenda" "LaundryItem" NOT NULL,
    "descripcion" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "precio_unitario" DECIMAL(65,30) NOT NULL,
    "precio_total" DECIMAL(65,30) NOT NULL,
    "estado" "LaundryStatus" NOT NULL DEFAULT 'PENDIENTE',
    "fecha_entrega" TIMESTAMP(3),
    "nombre_cliente" TEXT NOT NULL,
    "numero_habitacion" TEXT,
    "notas" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lavanderia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_cc_key" ON "users"("cc");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_cedula_key" ON "clientes"("cedula");

-- CreateIndex
CREATE UNIQUE INDEX "parqueadero_mensual_placa_key" ON "parqueadero_mensual"("placa");

-- AddForeignKey
ALTER TABLE "hospedajes" ADD CONSTRAINT "hospedajes_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hospedajes" ADD CONSTRAINT "hospedajes_habitacion_numero_fkey" FOREIGN KEY ("habitacion_numero") REFERENCES "habitaciones"("numero") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventario" ADD CONSTRAINT "inventario_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventas" ADD CONSTRAINT "ventas_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventas" ADD CONSTRAINT "ventas_hospedaje_id_fkey" FOREIGN KEY ("hospedaje_id") REFERENCES "hospedajes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "abonos" ADD CONSTRAINT "abonos_venta_id_fkey" FOREIGN KEY ("venta_id") REFERENCES "ventas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turnos" ADD CONSTRAINT "turnos_recepcionista_inicio_id_fkey" FOREIGN KEY ("recepcionista_inicio_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turnos" ADD CONSTRAINT "turnos_recepcionista_fin_id_fkey" FOREIGN KEY ("recepcionista_fin_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos_parqueadero" ADD CONSTRAINT "pagos_parqueadero_parqueadero_id_fkey" FOREIGN KEY ("parqueadero_id") REFERENCES "parqueadero_mensual"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logs_auditoria" ADD CONSTRAINT "logs_auditoria_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
