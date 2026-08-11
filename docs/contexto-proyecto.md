# SAPAY HOTEL - Contexto del Proyecto

## Objetivo
Sistema de gestión hotelera con escritorio (administración) y, en el futuro, página web pública para clientes.

## Arquitectura (actual)
- **Monorepo** con npm workspaces
- **API**: NestJS + Prisma + PostgreSQL
- **Escritorio**: Electron + React + Vite (app instalable en el PC del hotel)
- **Web**: (futuro) React + Vite para clientes
- **BD**: PostgreSQL — el escritorio maneja su propio motor embebido

### BD: cómo funciona
- **Desarrollo**: usa PostgreSQL del sistema (localhost:5432, usuario SapayUser)
- **Producción (app empaquetada)**: usa PostgreSQL embebido (localhost:5444, usuario sapay). Electron inicia/para el motor automáticamente.
- **Nube + sincronización**: no implementado aún. Primero se termina la versión local, luego se agrega.

### Web (futuro)
Cuando se implemente, compartirá la misma API y BD. El escritorio tendrá un modo "sin internet" con respaldo local y sincronización al reconectar.

## Estructura del proyecto
```
sapay/
├── apps/
│   ├── api/           # API REST NestJS (puerto 3333)
│   ├── desktop/       # Escritorio Electron + React
│   └── web/           # (futuro) Página web para clientes
├── packages/
│   ├── database/      # Schema Prisma y cliente
│   └── ui/            # (futuro) Componentes React compartidos
├── .env               # DATABASE_URL
└── package.json       # Scripts raíz
```

## BD - Esquema Actual (Prisma)
### Enums
- `Role`: ADMIN, RECEPTION
- `RoomType`: DOBLE, MATRIMONIAL, SENCILLA
- `RoomStatus`: DISPONIBLE, OCUPADA, RESERVADA, MANTENIMIENTO
- `StayStatus`: ACTIVA, FINALIZADA, CANCELADA
- `AcType`: AIRE, VENTILADOR
- `VehicleType`: MOTO, CARRO, CAMIONETA, CAMION_LIVIANO, PESADO

### Tablas
1. **users** - Usuarios del sistema (admin, recepción)
2. **clientes** - Clientes permanentes (nombre, apellido, cedula, telefono, ciudad_origen, ciudad_destino, profesion, notas)
3. **habitaciones** - 17 habitaciones con tipo, precios (A/V), estado
4. **hospedajes** - Estadías activas (cliente → habitación, fechas, noches, precio, total, tipo_aire_usado)
5. **productos** - Catálogo de tienda (nombre, precio)
6. **inventario** - Stock de productos
7. **ventas_diarias** - Ventas por producto por día
8. **parqueadero_mensual** - Vehículos en parqueadero mensual (propietario, placa, teléfono, línea, tipo, valor_mensual)
9. **pagos_parqueadero** - Pagos mensuales (mes 1-12, año, valor)

### Habitaciones (17)
- **Doble** (2 camas): 101 (A+V), 102 (solo A), 112 (solo A) — $95.000 A / $85.000 V
- **Matrimonial**: 103, 105 (A+V), 107 (A+V), 109, 201, 202, 203, 204 — $85.000 A / $75.000 V
- **Sencilla**: 104 (A+V), 108 (A+V), 111 (A+V), 106, 110, 113 — $55.000 A / $45.000 V

### Parqueadero - Precios
| Tipo | Mensual | Día |
|------|---------|-----|
| Moto | $50.000 | $5.000 |
| Carro | — | $15.000 |
| Camioneta | $150.000 | $10.000 |
| Camión liviano | $200.000 | $20.000 |
| Pesado | $300.000 | $30.000 |

## Flujos importantes
### Registro de huésped (llegada)
Un solo formulario: datos del cliente + habitación + noches → el sistema crea **automáticamente** el cliente (si no existe) y el hospedaje, y marca la habitación OCUPADA.

### Registro de huésped (salida)
Seleccionar hospedaje activo → poner fecha de salida → calcular total → marcar habitación DISPONIBLE. El cliente permanece en clientes.

### Reserva web (futuro)
Cliente reserva desde `mihotel.com` → queda en la BD → el escritorio lo muestra automáticamente cuando hay internet.

## Cómo arranca la app (producción)
1. Electron inicia la ventana
2. Electron inicia PostgreSQL embebido (port 5444) automáticamente
3. Electron hace `prisma db push` para asegurar que las tablas existen
4. Electron spawns la API NestJS como proceso hijo y espera que responda
5. App lista para usar

### En desarrollo
- API corre aparte con `nest start --watch` (concurrently)
- El escritorio omite PostgreSQL embebido y solo espera a que la API externa responda
- La BD es la del sistema (port 5432) o la que apunte DATABASE_URL

## Estado actual
- [x] Monorepo configurado
- [x] BD creada con Prisma (tablas y seed de 17 habitaciones)
- [x] API NestJS funcionando (auth, login, register)
- [x] Escritorio con Electron mostrando ventana
- [x] Modo dev: API + escritorio arrancan con `npm run dev`
- [ ] Dashboard de administración (UI)
- [ ] CRUD de clientes, habitaciones, hospedajes
- [ ] Módulo de inventario/tienda
- [ ] Módulo de parqueadero
- [ ] Corte de caja (futuro)
- [ ] Página web para clientes (futuro)

## Cómo correr en desarrollo
```bash
npm run dev
# API en http://localhost:3333
# Escritorio en http://localhost:5173 (renderer)
# El escritorio espera a que la API esté lista automáticamente
```
