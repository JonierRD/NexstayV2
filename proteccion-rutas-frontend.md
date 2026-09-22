# Protección de Rutas en el Frontend (Vue 3 + Vue Router + Pinia)

Proyecto: `svu` (JHipster Vue). Stack: Vue 3, `vue-router` (`createWebHistory`), Pinia (`account-store`), Axios con JWT Bearer, directiva personalizada `v-can`.

La protección es **solo UX / navegación**, no es seguridad real: la seguridad autoritativa está en el backend. El frontend hace 5 capas complementarias:

1. Declaración de roles por ruta (`meta.authorities`)
2. Guard global (`router.beforeResolve` en `main.ts`)
3. Sesión / identidad (`AccountService` + `account-store` + JWT)
4. Interceptor Axios (401/403 → logout + modal login)
5. Ocultamiento condicional en UI (`v-can`, `v-if="authenticated"`, `hasAnyAuthority`)

---

## 1. Declaración de permisos por ruta: `meta: { authorities: [...] }`

### Archivos

| Archivo | Responsabilidad |
|---|---|
| `src/main/webapp/app/router/index.ts` | Crea el router, fusiona sub-routers, guard de `/not-found` |
| `src/main/webapp/app/router/admin.ts` | Rutas `/admin/*` → solo `ROLE_ADMIN` |
| `src/main/webapp/app/router/account.ts` | Rutas `/register`, `/account/*` |
| `src/main/webapp/app/router/entities.ts` | Entidades `oficina`, `pqrs`, `respuesta`, `archivo-adjunto`, `notificaciones`, `informe-pqrs` |
| `src/main/webapp/app/router/pages.ts` | Rutas **públicas**, sin `meta.authorities` |
| `src/main/webapp/app/shared/security/authority.ts` | Enum `Authority` |

### Enum de roles (`shared/security/authority.ts:1-6`)

```ts
export enum Authority {
  ADMIN = 'ROLE_ADMIN',
  FUNCTIONARY = 'ROLE_FUNCTIONARY',
  FRONT_DESK_CS = 'ROLE_FRONT_DESK_CS',
  USER = 'ROLE_USER',
}
```

### Ejemplo: admin solo ADMIN (`router/admin.ts:13-19`)

```ts
{
  path: '/admin/user-management',
  name: 'JhiUser',
  component: JhiUserManagementComponent,
  meta: { authorities: [Authority.ADMIN] },
}
```

Todas las rutas de `admin.ts`, `oficina`, `archivo-adjunto` e `informe-pqrs` exigen `ROLE_ADMIN`.

### Entidades con granularidad por rol (`router/entities.ts`)

```ts
// Solo ventanilla y admin pueden crear PQRS:
{ path: 'pqrs/new', meta: { authorities: [Authority.FRONT_DESK_CS, Authority.ADMIN] } }
// Ver PQRS: más amplio
{ path: 'pqrs/:pqrsId/view', meta: { authorities: [Authority.ADMIN, Authority.FUNCTIONARY, Authority.FRONT_DESK_CS] } }
// Responder: solo funcionario y admin
{ path: 'respuesta/new', meta: { authorities: [Authority.ADMIN, Authority.FUNCTIONARY] } }
```

### Rutas públicas (`router/pages.ts:6-31`)

`/public/pqrs/new`, `/public/pqrs/track/:accessToken`, `/public/pqrs/verify`, `/public/pqrs/consult` **no tienen `meta.authorities`**, por eso el guard las deja pasar sin login. Es el canal ciudadano anónimo (por `accessToken`, no por sesión).

### Rutas de error (`router/index.ts:34-45`)

```ts
{ path: '/forbidden', component: Error, meta: { error403: true } },
{ path: '/not-found', component: Error, meta: { error404: true } },
```

---

## 2. Guard global: el único punto que realmente bloquea navegación

### 2.1 Guard de 404 (`router/index.ts:56-61`)

```ts
router.beforeResolve(async (to, from, next) => {
  if (!to.matched.length) {
    return next({ path: '/not-found' });
  }
  next();
});
```

Si la URL no matchea ninguna ruta → `/not-found`.

### 2.2 Guard de autenticación + autorización (`main.ts:116-133`)

Este es el corazón de la protección:

```ts
router.beforeResolve(async (to, from, next) => {
  loginService.hideLogin(); // cierra modal login en cada navegación

  if (!store.authenticated) {
    await accountService.update(); // intenta recuperar sesión desde JWT
  }
  if (to.meta?.authorities && to.meta.authorities.length > 0) {
    const value = await accountService.hasAnyAuthorityAndCheckAuth(to.meta.authorities);
    if (!value) {
      if (from.path !== '/forbidden') {
        next({ path: '/forbidden' });
        return;
      }
    }
  }
  next();
});
```

Flujo paso a paso:

```
Navegación a `to`
  → cierra modal login
  → ¿store.authenticated == false? → GET management/info + GET api/account (si hay JWT válido)
  → ¿to.meta.authorities existe y no está vacío?
      NO → next() (ruta pública: /, /public/*, /forbidden, /not-found)
      SÍ → ¿usuario.authorities ∩ to.meta.authorities != ∅?
             SÍ → next()
             NO → next('/forbidden')
```

Puntos clave:

- Evaluación **lazy**: solo llama al backend (`api/account`) si Pinia dice `authenticated == false`. Si ya hay sesión, no re-valida en cada navegación.
- `from.path !== '/forbidden'` evita bucle infinito de redirección forbidden → forbidden.
- No hay redirección a `/login` como página: el login es un **modal** (`loginService.openLogin()` → evento `bv::show::modal`).

---

## 3. Sesión e identidad: `AccountService` + Pinia + JWT

### 3.1 Store (`shared/config/store/account-store.ts`)

```ts
state: { userIdentity, authenticated: false, logon, profilesLoaded, ... }
getters:
  account → state.userIdentity
  userRole → 'admin' | 'front_desk' | 'functionary' | 'user' | 'anonymous'
             // prioridad: ADMIN > FRONT_DESK_CS > FUNCTIONARY > USER
actions: setAuthentication(identity), logout(), authenticate(promise)
```

`logout()` simplemente pone `userIdentity = null, authenticated = false`. El borrado del token se hace en el navbar (`jhi-navbar.component.ts:43-50`).

### 3.2 Servicio (`account/account.service.ts`)

```ts
update() → retrieveProfiles() + loadAccount()
loadAccount():
  token = localStorage['jhi-authenticationToken'] || sessionStorage['jhi-authenticationToken']
  if (authenticated && userAuthorities && token) return; // ya hay sesión
  promise = retrieveAccount() // GET api/account
retrieveAccount():
  GET api/account → 200 + data.login → store.setAuthentication(account) → true
  catch → store.logout() → false

hasAnyAuthorityAndCheckAuth(authorities):
  return checkAuthorities(authorities) // ¿alguno de mis roles está en la lista?

checkAuthorities():
  return this.userAuthorities.includes(authority) // para cada authority requerida
```

El JWT vive en `localStorage` (recordarme) o `sessionStorage` (sesión). Sin token, `retrieveAccount()` falla → `logout()` → el guard niega todo lo que pida `authorities`.

---

## 4. Interceptor Axios: protege llamadas API, no solo rutas

`shared/config/axios-interceptor.ts:4-15`:

```ts
// Request: inyecta JWT en cada llamada
config.headers.Authorization = `Bearer ${token}`;
config.url = `${SERVER_API_URL}${config.url}`;
```

`main.ts:135-153` + `axios-interceptor.ts:16-32`:

```ts
setupAxiosInterceptors(
  error => { // onUnauthenticated (401 o 403)
    if (status === 401) {
      store.logout();
      if (!url.endsWith('api/account') && !url.endsWith('api/authenticate')) {
        loginService.openLogin(); // abre modal login
        return;
      }
    }
    return Promise.reject(error);
  },
  error => Promise.reject(error) // onServerError (5xx)
);
```

Efecto: aunque el usuario manipule el router para entrar a una vista, los `GET/POST` al backend fallan con 401/403 → se deslogea y se le pide login. La API sigue siendo la barrera real.

---

## 5. Ocultamiento condicional en la UI (defensa en profundidad)

No bloquean URL, solo evitan mostrar enlaces/botones.

### 5.1 Directiva global `v-can` (`main.ts:169-176`)

```ts
app.directive('can', (el, binding) => {
  const { can } = usePermissions();
  const [action, subject] = binding.value;
  if (!can(action, subject)) {
    el.parentNode?.removeChild(el); // elimina el nodo del DOM
  }
});
```

Uso en plantillas:

```vue
<!-- core/home/home.vue:34 -->
<b-col v-can="['user-manager', 'admin']">

<!-- entities/entities-menu.vue -->
<b-dropdown-item v-can="['view', 'responses']" to="/respuesta">
<b-dropdown-item v-can="['view', 'offices']" to="/oficina">

<!-- entities/pqrs/pqrs.vue:12 -->
<button v-can="['create', 'pqrs']">Crear PQRS</button>

<!-- entities/pqrs/sidebar.vue -->
<div v-can="['respond', 'pqrs']">Responder</div>
<div v-can="['resolve', 'pqrs']">Resolver</div>
```

### 5.2 Matriz de permisos (`shared/composables/use-permissions.ts:28-52`)

Mapea `userRole` (derivado del store) → acciones permitidas. `admin` tiene `all: true` (bypass total):

```ts
admin:       { all: { all: true } }
front_desk:  { pqrs: ['view','create','edit','ask_by_office'], notifications: [...], responses: ['view'], sidebar: ['view'] }
functionary: { pqrs: ['view','respond','resolve'], responses: ['view','create'], ... }
user:        { pqrs: ['view'], responses: ['view'], notifications: ['view'] }
anonymous:   {}
```

`can(action, subject)`:

1. Si `role === 'admin'` → `true` siempre.
2. Si no, busca `permissions[role][subject]` y verifica `includes(action)`.

Nota: es independiente de `meta.authorities`. Puede haber divergencias (ej. una ruta permite `ROLE_USER` pero `use-permissions` no le da botones). Son dos sistemas paralelos: router = acceso a página, `v-can` = visibilidad de acción.

### 5.3 `v-if="authenticated"` y `hasAnyAuthority` en navbar

`core/jhi-navbar/jhi-navbar.vue`:

```vue
<b-nav-item-dropdown v-if="authenticated">Entidades</b-nav-item-dropdown>
<notification-menu v-if="authenticated">
<b-dropdown-item to="/account/settings" v-if="authenticated">
<b-dropdown-item @click="logout()" v-if="authenticated">
<b-dropdown-item @click="openLogin()" v-if="!authenticated">
<b-dropdown-item v-can="['view','admin']" v-if="authenticated">Administración</b-dropdown-item>
```

`jhi-navbar.component.ts:66-73` — `hasAnyAuthority(authorities)` (versión async con caché para plantillas, delega en `accountService`).

### 5.4 Raíz pública vs privada (`pages/root/root.component.ts:9-14`)

```ts
const currentComponent = computed(() =>
  authenticated?.value ? Home : Welcome
);
```

`/` siempre es accesible: si hay sesión muestra `Home`, si no muestra `Welcome` (landing pública). Por eso `/` no lleva `authorities`.

---

## Diagrama resumen

```
┌─────────────┐     ┌──────────────────┐     ┌────────────────────┐
│ meta.       │     │ beforeResolve    │     │ AccountService +   │
│ authorities │────▶│ en main.ts       │────▶│ Pinia + JWT        │
│ por ruta    │     │ ¿tiene alguno de │     │ GET api/account    │
│ (admin/     │     │ los roles?       │     │ local/session      │
│ entities/   │     │ SÍ → next()      │     │ Storage            │
│ account/    │     │ NO → /forbidden  │     │                    │
│ pages=pub)  │     │ sin meta → next()│     │                    │
└─────────────┘     └──────────────────┘     └────────────────────┘
        │                     │                         │
        ▼                     ▼                         ▼
┌─────────────┐     ┌──────────────────┐     ┌────────────────────┐
│ v-can +     │     │ Axios interceptor│     │ /forbidden y       │
│ v-if auth   │     │ Bearer + 401→    │     │ /not-found →       │
│ ocultan UI  │     │ logout + modal   │     │ error.vue          │
└─────────────┘     └──────────────────┘     └────────────────────┘
```

---

## Archivos para modificar según el caso

- **Nueva ruta protegida**: añadir entrada con `meta: { authorities: [...] }` en `router/admin.ts`, `router/entities.ts` o `router/account.ts`.
- **Nueva ruta pública**: añadir en `router/pages.ts` sin `meta`.
- **Nuevo rol**: añadir a `Authority` (`shared/security/authority.ts`), a `userRole` (`account-store.ts:26-45`) y a la matriz `permissions` (`use-permissions.ts`).
- **Nuevo botón/acción**: añadir par `[action, subject]` a `permissions` y usar `v-can="['action','subject']"`.
- **Cambiar redirección de denegado**: `main.ts:126-129` (`next({ path: '/forbidden' })`).

## Limitaciones conocidas

1. Todo lo del frontend es eludible (devtools). La autorización real debe estar en el backend (Spring Security).
2. `v-can` solo se evalúa al montar la directiva; no es reactiva a cambios de rol sin re-render.
3. `usePermissions.can()` tiene `if (permissions.admin.all.all)` que siempre es `true` antes de chequear el rol — funciona porque luego filtra por `role === 'admin'`, pero es confuso.
4. El guard no distingue 401 (no logueado → debería abrir login) de 403 (logueado sin rol → `/forbidden`); ambos van a `/forbidden`.
