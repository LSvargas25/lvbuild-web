# Frontend setup — diseño (2026-08-25)

## Contexto

Arrancamos el frontend del ERP LVConstrucciones en `Fronted/`, carpeta hermana de
`Backend/LvTest/` (.NET 8, EF Core 9, SQL Server). Este documento registra las
decisiones tomadas antes de scaffoldear, para no tener que re-descubrirlas.

## Datos confirmados del backend (leídos de código/config el 2026-08-25)

- Backend dev: `http://localhost:5142` (http) / `https://localhost:7297` (https).
- CORS: política `"default"` (`LvApi/CorsPolicies.cs`, const `Default`). En
  `LvApi/appsettings.Development.json` → `Cors:AllowedOrigins` ya incluye
  `http://localhost:5173`. No requiere cambios en el backend.
- JWT: el claim de rol se genera con `ClaimTypes.Role` (`LvInfrastructure/Auth/JwtTokenService.cs`),
  que serializa como el URI largo `http://schemas.microsoft.com/ws/2008/06/identity/claims/role`.
  **No se decodifica el JWT en el frontend** — `LoginResponseDto` y `UserProfileDto`
  devuelven `roles: string[]` directamente en el JSON de respuesta.
- Roles de negocio (código exacto usado en `[Authorize(Roles=...)]`):
  `GeneralManager`, `OperationsDirector`, `ProjectAdmin`, `BranchAdmin`
  (Gerencia / Dirección de Operaciones / Administrador de Proyecto / Administrador de Sucursal).
  - **Pendiente**: apareció un rol `BusinessManager` suelto en
    `InventoryMovementsController` que no es uno de los 4 roles de negocio documentados.
    Queda anotado para revisar cuando se ataque el módulo de Bodega — no se investiga ahora.
- Endpoints/DTOs de auth (de `swagger.json` real, `/api/*`):
  - `POST /api/auth/login` → `{ email, password }` → `LoginResponseDto`:
    `{ accessToken, refreshToken, accessTokenExpiresAt, userId, name, email, roles[] }`
  - `POST /api/auth/refresh-token` → `{ refreshToken }` → mismo `LoginResponseDto`
  - `POST /api/auth/logout`
  - `GET/PUT /api/auth/me` → `UserProfileDto`:
    `{ id, name, email, status, profilePhotoPath, roles[], createdAt, lastLoginAt }`
    (PUT recibe `{ name }`)
  - `POST /api/auth/me/change-password`, `POST /api/auth/me/photo`

## Decisiones técnicas (aprobadas por el usuario)

1. **Tokens**: `localStorage` para access y refresh token. El backend no expone
   cookie httpOnly para refresh; es el approach estándar de SPA para este caso.
   Trade-off aceptado: expuesto a XSS, aceptable para ERP interno.
2. **Interceptor de refresh**: axios response interceptor detecta 401, dispara
   un único refresh en vuelo (single-flight) y encola las requests concurrentes
   que fallaron mientras se resuelve. Si el refresh falla, limpia sesión y
   redirige a `/login`.
3. **Router**: `react-router-dom` con `createBrowserRouter`. Ruta layout
   protegida (`ProtectedRoute`) que valida token presente y, opcionalmente,
   rol requerido antes de renderizar hijos.
4. **Estructura de carpetas** (por feature):
   ```
   src/
     app/          # App.tsx, router, providers (QueryClient, etc.)
     components/
       ui/         # shadcn
       layout/     # Sidebar, Header, AppLayout
     features/
       auth/       # login, perfil — único feature creado en este setup
     lib/
       api/        # cliente axios + interceptores + funciones por endpoint
       utils.ts    # cn() de shadcn, helpers
     routes/       # definición de rutas + guards
     types/        # roles, DTOs compartidos
   ```
   Los demás módulos de negocio (clientes, presupuestos, ofertas, proyectos,
   bitácoras, planillas, comercial, bodega, notificaciones) se agregan como
   carpetas nuevas en `features/` cuando se aborde cada uno.
5. **Tailwind v4**, con el setup por defecto que configura el CLI de shadcn/ui
   (tokens CSS, sin `tailwind.config.js` clásico).

## Paleta y tipografía

Se presentaron 3 opciones como mockup visual (artifact) sobre el layout real de
sidebar + header + tabla. El usuario eligió **Opción C — "Obra"** (concreto +
ladrillo):

- Fondo `#EEEDE8`, texto `#2A2724`, acento (primary) `#A8461F` (ladrillo),
  concreto `#55625A`, borde `#DEDBD3`. Sidebar oscuro (`#3A3733`) fijo en
  ambos temas — decisión de diseño intencional, no varía con light/dark.
- Tipografía: **Barlow Condensed** (600/700) en títulos — condensada, evoca
  calcomanías de maquinaria/obra — y **Work Sans** (variable) en texto, con
  **Roboto Mono** (500) para cifras/tablas. Fuentes self-hosted vía paquetes
  `@fontsource` (mismo patrón que Geist, que reemplazan).
- Radio de borde reducido a `0.375rem` (antes 0.625rem) para un look más
  estructural/menos suave.
- Tema oscuro definido con la misma lógica (ladrillo más claro `#D9784A`
  sobre fondo `#1C1A17`), no es una simple inversión automática.
- Tokens aplicados en `src/index.css` (`:root` / `.dark`), consumidos por
  `@theme inline` de shadcn — sin `tailwind.config.js` clásico (Tailwind v4).

## Fuera de alcance de este setup

- Módulos de negocio (catálogos, presupuesto/oferta/proyecto, bitácora/planilla,
  comercial, bodega, notificaciones) — arrancan en una conversación posterior,
  cada uno con su propio ciclo brainstorm → plan → implementación.
- Testing automatizado del frontend (no pedido en este paso).
