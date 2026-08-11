# SAPAY

Aplicacion de escritorio para gestion hotelera, preparada con Electron, React, TypeScript, Tailwind, NestJS, Prisma y PostgreSQL local.

## Requisitos

- Node.js 22 o superior
- npm 10 o superior
- PostgreSQL instalado localmente

## Primer arranque

1. Copia `.env.example` a `.env` y ajusta `DATABASE_URL` si tu PostgreSQL usa otra clave, usuario o puerto.
2. Instala dependencias:

```bash
npm install
```

3. Genera el cliente de Prisma:

```bash
npm run prisma:generate
```

4. Levanta API y escritorio en modo desarrollo:

```bash
npm run dev
```

## Estructura

```text
apps/
  api/       API local con NestJS
  desktop/   Aplicacion de escritorio con Electron + React
packages/
  database/  Configuracion Prisma para PostgreSQL
```

Los modulos del negocio se agregaran despues, cuando quede definida la lista exacta.
