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

Se proponen 2-3 opciones pensadas para una constructora real (sin los grises/violetas
default de shadcn) y se espera aprobación del usuario antes de aplicarlas a los
tokens de Tailwind — ver conversación, no se fija de antemano en este documento.

## Fuera de alcance de este setup

- Módulos de negocio (catálogos, presupuesto/oferta/proyecto, bitácora/planilla,
  comercial, bodega, notificaciones) — arrancan en una conversación posterior,
  cada uno con su propio ciclo brainstorm → plan → implementación.
- Testing automatizado del frontend (no pedido en este paso).
