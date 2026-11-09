# Plan de pruebas del frontend

Documento de trabajo para la entrega de **10 pruebas unitarias + 2 de integración**
del frontend de NexStay (Electron + React + TypeScript).

## Alcance

- Solo `apps/desktop/src/renderer` (UI, hooks, utilidades y capa API del cliente).
- No se prueban `main` ni `preload` de Electron.
- Runner: **Vitest + Testing Library + jsdom**.

## Cómo ejecutar

Desde la raíz del repositorio:

```bash
npm test                 # corre las 12 suites (unitarias + integración)
npm run test:coverage    # genera reporte HTML en apps/desktop/coverage
npm run test --workspace @sapay/desktop -- tests/unit/format.test.ts
npm run test:watch --workspace @sapay/desktop
```

La salida agrupa los archivos por **unitarias** e **integración**, muestra el
responsable y el avance (`aprobadas/total`) de cada uno, y deja el detalle de los
fallos debajo del resumen. Los archivos aún sin implementar aparecen como
`PENDIENTE` con sus casos en `it.todo`.

Atajos dentro de `apps/desktop`:

```bash
npm test
npm run test:unit
npm run test:integration
npm run test:coverage
```

## Estructura

```
apps/desktop/
├── vitest.config.mts
└── tests/
    ├── setup.ts                 # limpieza global (solo Jonier)
    ├── reporters/
    │   └── grouped.ts           # salida agrupada por categoría y responsable
    ├── helpers/
    │   ├── fixtures.ts          # datos de ejemplo
    │   ├── mocks.ts             # puente IPC, fetch, respuestas
    │   └── render.tsx           # render con AuthProvider
    ├── unit/                    # 10 pruebas unitarias
    └── integration/             # 2 pruebas de integración
```

## Reparto

| ID | Archivo | Qué verifica | Responsable | Estado |
|---|---|---|---|---|
| U1 | `tests/unit/format.test.ts` | Formato de moneda, fechas y tiempo transcurrido | Belladira | Completado (6/6) |
| U2 | `tests/unit/dashboard-metrics.test.ts` | Métricas del dashboard y cuentas por cobrar | Belladira | Completado (8/8) |
| U3 | `tests/unit/stay-account.test.ts` | Cuenta de un hospedaje (cargos, pagos, saldo) | Belladira | Completado (7/7) |
| U4 | `tests/unit/api-client.test.ts` | `apiRequest`, token y `ApiError` | Harold | Completado (8/8) |
| U5 | `tests/unit/auth-interceptors.test.ts` | Interceptor 401/403 y limpieza de sesión | Harold | Completado (6/6) |
| U6 | `tests/unit/settings-cache.test.tsx` | Cache de configuración y `useHotelBrand` | Harold | Completado (5/5) |
| U7 | `tests/unit/roles-access.test.ts` | Jerarquía de roles y acceso a rutas | Jonier | Completado (7/7) |
| U8 | `tests/unit/permissions.test.tsx` | `canAccessModule` y `usePermissions` | Jonier | Completado (7/7) |
| U9 | `tests/unit/ui-primitives.test.tsx` | `StatusPill`, `FilterSelect`, `DetailLine`, `StatCard` | Legarda | Pendiente |
| U10 | `tests/unit/modal-breakpoint.test.tsx` | `Modal` y `useBreakpoint` | Legarda | Pendiente |
| I1 | `tests/integration/auth-flow.test.tsx` | Login → dashboard → sidebar por rol → logout | Jonier | Completado (4/4) |
| I2 | `tests/integration/checkin-flow.test.tsx` | Wizard completo de check-in | Legarda | Pendiente |

Cada archivo agrupa varios casos `it(...)`. Se puede ejecutar la suite completa
o filtrar un único caso con `-t`; por eso no es necesario crear un archivo
separado para cada caso.

## Ejecución rápida por integrante

Todos los comandos se ejecutan desde la raíz del repositorio. La ruta del
archivo ejecuta la suite completa. Al agregar `-t` y el texto del caso se
ejecuta un único caso. El resumen mostrará `1` prueba aprobada y las restantes
omitidas; la fila del archivo puede mostrar, por ejemplo, `1/6`, porque el
reporter conserva el total de casos definidos en la suite.

Para los casos específicos, entrar primero a `apps/desktop`, porque así `-t`
llega directamente a Vitest:

```bash
cd apps/desktop
```

### Pruebas de Belladira

#### Suites completas

**U1 — Formatos (`6/6`)**

```bash
npm test --workspace @sapay/desktop -- tests/unit/format.test.ts
```

Prueba formatos de moneda, fechas, rangos de fechas, tiempo transcurrido y
fecha/hora numérica.

**U2 — Métricas del dashboard (`8/8`)**

```bash
npm test --workspace @sapay/desktop -- tests/unit/dashboard-metrics.test.ts
```

Prueba métricas de habitaciones, ventas del día, cuentas por cobrar y estados
de lavandería.

**U3 — Cuenta de hospedaje (`7/7`)**

```bash
npm test --workspace @sapay/desktop -- tests/unit/stay-account.test.ts
```

Prueba cargos de habitación, ventas fiadas, lavandería, anticipos, pagos y
saldo de una estancia.

#### Casos específicos

**U1 — `format.test.ts`**

```bash
npx vitest run tests/unit/format.test.ts -t "formatCOP redondea"
npx vitest run tests/unit/format.test.ts -t "formatCOP funciona"
npx vitest run tests/unit/format.test.ts -t "formatDate, formatDateShort"
npx vitest run tests/unit/format.test.ts -t "formatDateRange"
npx vitest run tests/unit/format.test.ts -t "formatElapsed"
npx vitest run tests/unit/format.test.ts -t "formatDateTimeNumeric"
```

Los casos validan, respectivamente, redondeo y símbolo de moneda; cero y
negativos; formatos de fecha; rangos y estado `En curso`; tiempo transcurrido;
y formato numérico de fecha/hora. Cada comando ejecuta un solo caso y muestra
`1` aprobado y los demás omitidos.

**U2 — `dashboard-metrics.test.ts`**

```bash
npx vitest run tests/unit/dashboard-metrics.test.ts -t "computeRoomMetrics cuenta"
npx vitest run tests/unit/dashboard-metrics.test.ts -t "computeRoomMetrics devuelve 0%"
npx vitest run tests/unit/dashboard-metrics.test.ts -t "isToday reconoce"
npx vitest run tests/unit/dashboard-metrics.test.ts -t "computeTodaySalesRevenue"
npx vitest run tests/unit/dashboard-metrics.test.ts -t "computePendingReceivable suma"
npx vitest run tests/unit/dashboard-metrics.test.ts -t "computePendingReceivable nunca"
npx vitest run tests/unit/dashboard-metrics.test.ts -t "selectActiveLaundry"
npx vitest run tests/unit/dashboard-metrics.test.ts -t "getLaundryBadge"
```

Los casos validan métricas de habitaciones con y sin datos; fecha actual;
ventas de contado del día; saldo pendiente con sus componentes y límite
inferior; exclusión de lavandería entregada; y etiquetas de lavandería. Cada
comando ejecuta un solo caso y muestra `1` aprobado y los demás omitidos.

**U3 — `stay-account.test.ts`**

```bash
npx vitest run tests/unit/stay-account.test.ts -t "estancia ACTIVA"
npx vitest run tests/unit/stay-account.test.ts -t "estancia FINALIZADA"
npx vitest run tests/unit/stay-account.test.ts -t "suma solo ventas"
npx vitest run tests/unit/stay-account.test.ts -t "suma la lavanderia"
npx vitest run tests/unit/stay-account.test.ts -t "aplica el credito"
npx vitest run tests/unit/stay-account.test.ts -t "resta los pagos"
npx vitest run tests/unit/stay-account.test.ts -t "balance nunca"
```

Los casos validan el cálculo de estancias activas y finalizadas; ventas fiadas;
lavandería; crédito de reserva; pagos parciales, cargos y saldo; y que el
saldo no sea negativo. Cada comando ejecuta un solo caso y muestra `1` aprobado
y los demás omitidos.

### Pruebas de Harold

#### Suites completas

**U4 — Cliente API (`8/8`)**

```bash
npm test --workspace @sapay/desktop -- tests/unit/api-client.test.ts
```

Prueba headers, token, serialización JSON, respuestas y errores de la capa API.

**U5 — Interceptores de autenticación (`6/6`)**

```bash
npm test --workspace @sapay/desktop -- tests/unit/auth-interceptors.test.ts
```

Prueba el token en `fetch`, respuestas `401`/`403`, limpieza de sesión y
protección contra doble instalación del interceptor.

**U6 — Cache de configuración (`5/5`)**

```bash
npm test --workspace @sapay/desktop -- tests/unit/settings-cache.test.tsx
```

Prueba la cache compartida de configuración, invalidación, eventos y
`useHotelBrand`.

#### Casos específicos

**U4 — `api-client.test.ts`**

```bash
npx vitest run tests/unit/api-client.test.ts -t "apiRequest agrega"
npx vitest run tests/unit/api-client.test.ts -t "apiRequest no agrega"
npx vitest run tests/unit/api-client.test.ts -t "apiRequest serializa"
npx vitest run tests/unit/api-client.test.ts -t "apiRequest devuelve JSON"
npx vitest run tests/unit/api-client.test.ts -t "apiRequest devuelve texto"
npx vitest run tests/unit/api-client.test.ts -t "ApiError con status"
npx vitest run tests/unit/api-client.test.ts -t "mensaje generico"
npx vitest run tests/unit/api-client.test.ts -t "setStoredToken/getStoredToken"
```

Los casos validan headers con y sin autenticación; body JSON; respuestas JSON y
de texto; errores `ApiError`; mensaje genérico; y almacenamiento del token. Cada
comando ejecuta un solo caso y muestra `1` aprobado y los demás omitidos.

**U5 — `auth-interceptors.test.ts`**

```bash
npx vitest run tests/unit/auth-interceptors.test.ts -t "adjunta el token"
npx vitest run tests/unit/auth-interceptors.test.ts -t "no sobrescribe"
npx vitest run tests/unit/auth-interceptors.test.ts -t "401 en /auth/login"
npx vitest run tests/unit/auth-interceptors.test.ts -t "401 en una ruta privada"
npx vitest run tests/unit/auth-interceptors.test.ts -t "403 emite forbidden"
npx vitest run tests/unit/auth-interceptors.test.ts -t "dos veces"
```

Los casos validan adjuntar y preservar tokens; el tratamiento de `401` público
y privado; el evento `403`; y que el interceptor no se duplique. Cada comando
ejecuta un solo caso y muestra `1` aprobado y los demás omitidos.

**U6 — `settings-cache.test.tsx`**

```bash
npx vitest run tests/unit/settings-cache.test.tsx -t "llama a la API solo"
npx vitest run tests/unit/settings-cache.test.tsx -t "comparte la misma promesa"
npx vitest run tests/unit/settings-cache.test.tsx -t "setSettingsCache evita"
npx vitest run tests/unit/settings-cache.test.tsx -t "invalidateSettings"
npx vitest run tests/unit/settings-cache.test.tsx -t "useHotelBrand devuelve"
```

Los casos validan una única llamada API; promesas paralelas compartidas; uso de
la cache; invalidación y evento; y nombre/logo del hotel. Cada comando ejecuta
un solo caso y muestra `1` aprobado y los demás omitidos.

### Espacio para capturas

Después de ejecutar cada suite o caso específico, agregar aquí la captura
correspondiente de la salida del comando.

## Flujo de Git

Todo se integra en `proyecto-actual`. **No se tocan `main` ni `develop`.**

1. Actualizar la rama base:
   ```bash
   git checkout proyecto-actual
   git pull
   ```
2. Crear una rama por integrante:
   ```bash
   git checkout -b test/belladira-unidades
   ```
3. Escribir solo los archivos propios, ejecutar y subir:
   ```bash
   npm test --workspace @sapay/desktop -- tests/unit/format.test.ts
   git add tests/unit/format.test.ts
   git commit -m "test(unit): formato de moneda y fechas"
   git push -u origin test/belladira-unidades
   ```
4. Abrir PR hacia `proyecto-actual` y pedir revisión cruzada.

### Reglas para evitar conflictos

- Solo Jonier modifica `vitest.config.mts`, `tests/setup.ts`, `tests/reporters/**` y `tests/helpers/**`.
- Cada archivo de prueba tiene un único dueño.
- No usar `git add -A` (hay capturas sueltas en la raíz del repo).
- Si una prueba descubre un bug, se corrige en un commit aparte y se avisa al
  responsable del módulo. No se adapta la prueba para ocultar el fallo.

## Casos especiales

- **Bug conocido (U5):** `isPublicAuthPath` compara la ruta completa
  (`http://.../auth/login`) contra `/auth/login`, por lo que un login fallido se
  reporta como sesión expirada. La prueba debe evidenciarlo; la corrección usa
  `toPathname()`.
- **Integraciones:** mockear la capa API (`vi.mock('@/lib/api', ...)`) en lugar
  de simular `fetch`. Es más estable y rápido.
- **Fechas:** usar `vi.setSystemTime()` y aserciones tolerantes
  (`toContain`/regex), porque `Intl` puede variar entre máquinas.
- **Interceptors:** el `afterEach` global ya limpia
  `__sapayAuthInterceptorsApplied` para poder reaplicarlo.

## Entrega

- 12 archivos en verde con `npm test`.
- Reporte de cobertura (`npm run test:coverage`).
- Tabla de resultados completada con el estado final y capturas.
