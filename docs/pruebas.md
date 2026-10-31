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
npm test                 # corre las 12 pruebas
npm run test:coverage    # genera reporte HTML en apps/desktop/coverage
npm run test --workspace @sapay/desktop -- tests/unit/format.test.ts
npm run test:watch --workspace @sapay/desktop
```

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
├── vitest.config.ts
└── tests/
    ├── setup.ts                 # limpieza global (solo Jonier)
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
| U1 | `tests/unit/format.test.ts` | Formato de moneda, fechas y tiempo transcurrido | Belladira | Pendiente |
| U2 | `tests/unit/dashboard-metrics.test.ts` | Métricas del dashboard y cuentas por cobrar | Belladira | Pendiente |
| U3 | `tests/unit/stay-account.test.ts` | Cuenta de un hospedaje (cargos, pagos, saldo) | Belladira | Pendiente |
| U4 | `tests/unit/api-client.test.ts` | `apiRequest`, token y `ApiError` | Harold | Pendiente |
| U5 | `tests/unit/auth-interceptors.test.ts` | Interceptor 401/403 y limpieza de sesión | Harold | Pendiente |
| U6 | `tests/unit/settings-cache.test.tsx` | Cache de configuración y `useHotelBrand` | Harold | Pendiente |
| U7 | `tests/unit/roles-access.test.ts` | Jerarquía de roles y acceso a rutas | Jonier | Pendiente |
| U8 | `tests/unit/permissions.test.tsx` | `canAccessModule` y `usePermissions` | Jonier | Pendiente |
| U9 | `tests/unit/ui-primitives.test.tsx` | `StatusPill`, `FilterSelect`, `DetailLine`, `StatCard` | Legarda | Pendiente |
| U10 | `tests/unit/modal-breakpoint.test.tsx` | `Modal` y `useBreakpoint` | Legarda | Pendiente |
| I1 | `tests/integration/auth-flow.test.tsx` | Login → dashboard → sidebar por rol → logout | Jonier | Pendiente |
| I2 | `tests/integration/checkin-flow.test.tsx` | Wizard completo de check-in | Legarda | Pendiente |

Cada archivo trae los casos como `it.todo(...)`. El integrante reemplaza cada
`it.todo` por un `it` con sus aserciones.

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

- Solo Jonier modifica `vitest.config.ts`, `tests/setup.ts` y `tests/helpers/**`.
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
