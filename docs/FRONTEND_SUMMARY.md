# FRONTEND_SUMMARY — LVConstrucciones (frontend)

> Análisis generado el 2026-10-05 sobre el commit `48885b9` (rama `master`).
> Proyecto: `lvconstrucciones-frontend` — SPA del ERP de LVConstrucciones. Consume la API
> .NET 8 que vive en la carpeta hermana `Backend/LvTest/` (según `docs/superpowers/specs/2026-08-25-frontend-setup-design.md`).

---

## 1. Stack y versiones

| Pieza | Tecnología | Versión instalada (de `npm ls`) |
|---|---|---|
| Framework UI | **React** (SPA, sin SSR) | 19.2.8 |
| Bundler / dev server | **Vite** (Rolldown) | 8.2.2 |
| Lenguaje | **TypeScript** | 6.0.3 (rango `~6.0.2`) |
| Router | react-router-dom (`createBrowserRouter`, modo data) | 7.18.2 |
| Estado de servidor | TanStack React Query | 5.102.3 |
| HTTP | axios | 1.19.0 |
| Formularios / validación | react-hook-form + zod (+ @hookform/resolvers) | 7.86.0 / 4.4.3 / 5.9.1 |
| Estilos | **Tailwind CSS v4** (plugin `@tailwindcss/vite`, sin `tailwind.config.js`) | 4.3.3 |
| Componentes | **shadcn/ui** estilo `base-nova` sobre **Base UI** (`@base-ui/react`), iconos lucide | shadcn 4.19.0 / Base UI 1.7.0 |
| Toasts | sonner (+ next-themes para el tema del toaster) | 2.0.8 |
| Linter | oxlint (plugins react, typescript, oxc) | 1.80.0 |
| Entorno usado | Node v24.18.0, npm 11.16.0 | — |

Gestor de paquetes: **npm** (`package-lock.json` presente). Alias de import `@/*` → `./src/*` (en `tsconfig.app.json` y `vite.config.ts`).

### Todas las dependencias de `package.json`

**dependencies**

| Paquete | Rango declarado | Instalada | Uso en el código |
|---|---|---|---|
| @base-ui/react | ^1.7.0 | 1.7.0 | primitivas de los componentes shadcn |
| @fontsource-variable/work-sans | ^5.3.0 | 5.3.0 | fuente de texto |
| @fontsource/barlow-condensed | ^5.3.0 | 5.3.0 | fuente de títulos (600/700) |
| @fontsource/roboto-mono | ^5.3.0 | 5.3.0 | fuente de cifras (500) |
| @hookform/resolvers | ^5.9.1 | 5.9.1 | zodResolver (login, caja) |
| @tailwindcss/vite | ^4.3.3 | 4.3.3 | plugin de Vite |
| @tanstack/react-query | ^5.102.3 | 5.102.3 | todas las consultas/mutaciones |
| @tanstack/react-table | ^9.1.2 | 9.1.2 | **no se usa en ningún archivo** |
| axios | ^1.19.0 | 1.19.0 | cliente HTTP |
| class-variance-authority | ^0.7.1 | 0.7.1 | variantes de componentes UI |
| clsx | ^2.1.1 | 2.1.1 | `cn()` |
| lucide-react | ^1.34.0 | 1.34.0 | iconos |
| next-themes | ^0.4.6 | 0.4.6 | solo `components/ui/sonner.tsx` (sin ThemeProvider) |
| react | ^19.2.8 | 19.2.8 | — |
| react-dom | ^19.2.8 | 19.2.8 | — |
| react-hook-form | ^7.86.0 | 7.86.0 | login, caja |
| react-router-dom | ^7.18.2 | 7.18.2 | routing |
| shadcn | ^4.19.0 | 4.19.0 | CLI + `shadcn/tailwind.css` importado en `index.css` |
| sonner | ^2.0.8 | 2.0.8 | toasts |
| tailwind-merge | ^3.6.0 | 3.6.0 | `cn()` |
| tailwindcss | ^4.3.3 | 4.3.3 | estilos |
| tw-animate-css | ^1.4.0 | 1.4.0 | animaciones |
| zod | ^4.4.3 | 4.4.3 | validación (login, caja) |

**devDependencies**

| Paquete | Rango declarado | Instalada |
|---|---|---|
| @types/node | ^24.13.3 | 24.13.3 |
| @types/react | ^19.2.18 | 19.2.18 |
| @types/react-dom | ^19.2.4 | 19.2.5 |
| @vitejs/plugin-react | ^6.1.0 | 6.1.0 |
| oxlint | ^1.79.0 | 1.80.0 |
| typescript | ~6.0.2 | 6.0.3 |
| vite | ^8.2.2 | 8.2.2 |

**Scripts:** `dev` (vite) · `build` (`tsc -b && vite build`) · `lint` (oxlint) · `preview` (vite preview). **No hay script de tests.**

---

## 2. Estructura

```
src/
├── main.tsx                     # punto de entrada: monta <App/> en #root (StrictMode)
├── index.css                    # Tailwind v4, tokens de tema (:root / .dark), fuentes
├── vite-env.d.ts                # tipado de import.meta.env (VITE_API_BASE_URL)
├── app/
│   ├── App.tsx                  # providers: QueryClient, AuthProvider, TooltipProvider, Router, Toaster
│   └── home-page.tsx            # pantalla de inicio ("Hola, {nombre}" + roles)
├── components/
│   ├── layout/
│   │   ├── app-layout.tsx       # SidebarProvider + sidebar + header + <Outlet/>
│   │   ├── app-sidebar.tsx      # menú lateral (Inicio, Presupuestos, Caja, Facturación)
│   │   └── site-header.tsx      # header con avatar, roles y "Cerrar sesión"
│   └── ui/                      # componentes shadcn generados (15 archivos)
│       avatar, badge, button, card, dropdown-menu, input, label, select,
│       separator, sheet, sidebar, skeleton, sonner, table, tooltip
├── features/                    # módulos de negocio (una carpeta por dominio)
│   ├── auth/                    # auth-context.tsx (contexto de sesión), login-page.tsx
│   ├── comercial/               # caja registradora + facturación (4 páginas + storage local)
│   ├── presupuestos/            # presupuesto → oferta → proyecto (6 páginas + máquina de estados)
│   └── bitacoras/               # bitácora semanal → planilla (5 páginas)
├── hooks/
│   └── use-mobile.ts            # detecta < 768px (lo usa el sidebar de shadcn)
├── lib/
│   ├── utils.ts                 # cn()
│   └── api/                     # capa HTTP
│       ├── client.ts            # instancia axios + interceptores (Bearer + refresh)
│       ├── auth-storage.ts      # sesión en localStorage
│       └── auth.ts, budgets.ts, commercial.ts, offers.ts, payroll.ts, projects.ts, sitelogs.ts
├── routes/
│   ├── router.tsx               # definición de todas las rutas
│   └── protected-route.tsx      # guard de autenticación (+ roles opcional)
└── types/                       # DTOs/interfaces del backend por dominio
    auth.ts, budgets.ts, commercial.ts, offers.ts, payroll.ts, projects.ts, roles.ts, sitelogs.ts
```

Otras carpetas en la raíz: `docs/superpowers/specs/` (documento de diseño del setup), `public/` (vacía), `.remember/` (estado local de un plugin, ignorado por git).

| Carpeta | Rol |
|---|---|
| `app/` | arranque y providers globales (equivalente a "core") |
| `components/ui` | librería de UI compartida (shadcn); no se edita a mano normalmente |
| `components/layout` | shell de la aplicación (sidebar + header) |
| `features/*` | pantallas y lógica por módulo de negocio |
| `lib/api` | toda la comunicación con el backend; una función por endpoint |
| `routes/` | routing y guards |
| `types/` | contratos (request/response) espejo de los DTOs del backend |
| `hooks/` | hooks reutilizables |

No existe carpeta `shared/` ni `core/` con esos nombres; ese papel lo cumplen `components/`, `lib/` y `types/`.

---

## 3. Módulos y pantallas

Rutas definidas en `src/routes/router.tsx`. Todas excepto `/login` están dentro de `ProtectedRoute` → `AppLayout`.

Leyenda de estado: ✅ completa (CRUD/flujo real contra API) · 🟡 a medias (funciona con datos reales pero falta funcionalidad clara) · 🧩 maqueta/placeholder.

| Ruta | Componente (archivo) | Qué hace | Estado |
|---|---|---|---|
| `/login` | `LoginPage` (`features/auth/login-page.tsx`) | Formulario email/contraseña (zod), llama `POST /auth/login`, guarda sesión, redirige a `/` | ✅ (ver bug de 401 en §5) |
| `/` (index) | `HomePage` (`app/home-page.tsx`) | Solo saluda con nombre y roles. Sin dashboard ni datos | 🧩 |
| `/comercial/caja` | `CashRegisterPage` (`features/comercial/cash-register-page.tsx`) | Abrir caja (sucursal + saldo inicial), ver caja abierta, cerrar caja (saldo contado), ver diferencia | 🟡 el id de la caja abierta se guarda en `localStorage`; no hay forma de recuperar la caja abierta desde otro navegador/equipo ni historial de cajas |
| `/comercial/facturas` | `InvoicesListPage` | Lista facturas por sucursal (selector), sin paginación en UI (primeras 20) | 🟡 |
| `/comercial/facturas/nueva` | `NewInvoicePage` | Factura borrador "consumidor final": líneas de producto × cantidad, contado/crédito, subtotal + IVA 13% estimado en cliente. Requiere caja abierta | 🟡 `customerId` siempre `null` (no se puede facturar a un cliente), sin buscador de productos |
| `/comercial/facturas/:id` | `InvoiceDetailPage` | Detalle, emitir con un pago, registrar abonos, anular (Gerencia/Dirección) | ✅ (un solo pago por emisión) |
| `/presupuestos` | `BudgetsListPage` | Lista de presupuestos (primeros 50) con estado y total | 🟡 sin paginación/filtros/búsqueda; no muestra cliente |
| `/presupuestos/nuevo` | `BudgetCreatePage` | Crea presupuesto con capítulos y actividades (materiales, mano de obra, equipo), utilidad %, indirectos | 🟡 `materialQuantity` no editable (siempre 0); no se puede editar un presupuesto existente (ni en Corrección) |
| `/presupuestos/:id` | `BudgetDetailPage` | Detalle + máquina de estados por rol (`budget-status.ts`): enviar a revisión, aprobar, solicitar corrección, retirar, marcar aprobado por cliente, cancelar; historial inmutable; botón "Crear oferta" si `Sent` y rol ProjectAdmin | ✅ |
| `/presupuestos/:budgetId/oferta` | `OfferCreatePage` | Crea oferta (llave en mano / por porcentaje) a partir del presupuesto | 🟡 `issueDate` = hoy y `estimatedStartDate` = hoy + 7 días fijos (no editables); no se envía `estimatedDeliveryDate` |
| `/ofertas/:id` | `OfferDetailPage` | Detalle, enviar al cliente (genera PDF), ver PDF, aceptar / revertir, crear proyecto (sucursal + fecha) | ✅ |
| `/proyectos/:id` | `ProjectDetailPage` | Ficha del proyecto (fechas, semanas, gastos, utilidad) + link a bitácoras | 🟡 solo lectura; no muestra trabajadores, planillas ni capítulos; **no existe listado de proyectos** (solo se llega desde una oferta) |
| `/proyectos/:projectId/bitacoras` | `SiteLogsListPage` | Bitácoras del proyecto (primeras 50) | ✅ |
| `/proyectos/:projectId/bitacoras/nueva` | `SiteLogCreatePage` | Bitácora semanal: semana (lunes→domingo), trabajo realizado, pendientes, trabajadores + horas | 🟡 no permite elegir capítulo (`chapterId`), ni porcentaje de avance |
| `/bitacoras/:id` | `SiteLogDetailPage` | Detalle; enviar a revisión (ProjectAdmin), aprobar / devolver con motivo (Gerencia/Dirección), crear planilla si está aprobada | ✅ |
| `/bitacoras/:siteLogId/planilla` | `PayrollCreatePage` | Planilla precargada desde la bitácora: tarifa editable, método de pago por trabajador | 🟡 `paymentType` siempre `Full`, un único pago por trabajador, sin adelantos/vacaciones/horas extra pese a que el tipo lo soporta |
| `/planillas/:id` | `PayrollDetailPage` | Detalle y "Marcar como pagada" (Gerencia/Dirección) | ✅ (no hay listado de planillas: `getPayrollsByProject` existe pero no se usa) |

**Navegación (sidebar):** solo enlaza Inicio, Presupuestos, Caja registradora y Facturación. Proyectos, bitácoras, ofertas y planillas solo son accesibles navegando desde otra pantalla.

**No hay** ruta 404 / `errorElement`, ni pantallas para: clientes, sucursales, productos/inventario/bodega, trabajadores, usuarios, perfil (`/auth/me`), notificaciones.

---

## 4. Conexión con el backend

**URL base:** `src/lib/api/client.ts:5` → `const baseURL = import.meta.env.VITE_API_BASE_URL`, tipada en `src/vite-env.d.ts:4`. El valor se define en `.env` (no versionado) y `.env.example` (versionado; apunta a un backend local en el puerto 5142, prefijo `/api`). No hay URLs hardcodeadas en `src/`, ni proxy de Vite.

Todas las llamadas usan `apiClient` (axios) salvo el refresh, que usa `refreshClient` (sin interceptores). Las rutas son relativas a `VITE_API_BASE_URL` (p. ej. `.../api` + `/budgets`).

`PagedResult<T>` = `{ items: T[], totalCount, pageNumber, pageSize }`.

| Método | Ruta | Función → archivo | Body (request) | Respuesta esperada |
|---|---|---|---|---|
| POST | `/auth/login` | `login` → `lib/api/auth.ts:9` | `LoginRequest { email, password }` | `LoginResponse` |
| POST | `/auth/logout` | `logout` → `lib/api/auth.ts:13` | — (sin body) | ignorada |
| GET | `/auth/me` | `getMe` → `lib/api/auth.ts:17` (**sin uso**) | — | `UserProfile` |
| PUT | `/auth/me` | `updateMe` → `lib/api/auth.ts:21` (**sin uso**) | `UpdateProfileRequest { name }` | `UserProfile` |
| POST | `/auth/refresh-token` | `refreshAccessToken` → `lib/api/client.ts:26` | `{ refreshToken }` | `LoginResponse` |
| GET | `/customers?pageSize=100` | `getCustomers` → `lib/api/budgets.ts:9` | — | `PagedResult<Customer { id, name }>` → usa `.items` |
| GET | `/budgets?pageSize=50` | `getBudgets` → `lib/api/budgets.ts:15` | — | `PagedResult<Budget>` |
| GET | `/budgets/{id}` | `getBudget` → `lib/api/budgets.ts:21` | — | `Budget` |
| GET | `/budgets/{id}/history` | `getBudgetHistory` → `lib/api/budgets.ts:25` | — | `BudgetHistoryEntry[]` |
| POST | `/budgets` | `createBudget` → `lib/api/budgets.ts:29` | `CreateBudgetRequest` | `Budget` |
| POST | `/budgets/{id}/submit-for-review` | `submitBudgetForReview` → `budgets.ts:33` | `{}` | `Budget` |
| POST | `/budgets/{id}/approve-internal` | `approveBudgetInternal` → `budgets.ts:37` | — | `Budget` |
| POST | `/budgets/{id}/request-correction` | `requestBudgetCorrection` → `budgets.ts:41` | `{ comment }` | `Budget` |
| POST | `/budgets/{id}/withdraw-from-commercial` | `withdrawBudgetFromCommercial` → `budgets.ts:47` | `{ comment }` | `Budget` |
| POST | `/budgets/{id}/mark-client-approved` | `markBudgetClientApproved` → `budgets.ts:53` | — | `Budget` |
| POST | `/budgets/{id}/cancel` | `cancelBudget` → `budgets.ts:57` | `{ reason }` | `Budget` |
| GET | `/branches?pageSize=100` | `getBranches` → `lib/api/commercial.ts:15` | — | `PagedResult<Branch>` → `.items` |
| GET | `/branches/{branchId}/inventory` | `getBranchInventory` → `commercial.ts:21` (**sin uso**) | — | `{ productId, productName, quantity }[]` |
| GET | `/products?pageSize=100` | `getProducts` → `commercial.ts:29` | — | `PagedResult<Product>` → `.items` |
| POST | `/cash-registers/open` | `openCashRegister` → `commercial.ts:35` | `OpenCashRegisterRequest { branchId, openingBalance }` | `CashRegister` |
| POST | `/cash-registers/{id}/close` | `closeCashRegister` → `commercial.ts:39` | `CloseCashRegisterRequest { closingBalance }` | `CashRegister` |
| GET | `/cash-registers/{id}` | `getCashRegister` → `commercial.ts:45` | — | `CashRegister` |
| POST | `/invoices` | `createInvoice` → `commercial.ts:49` | `CreateInvoiceRequest` | `Invoice` |
| GET | `/invoices/{id}` | `getInvoice` → `commercial.ts:53` | — | `Invoice` |
| POST | `/invoices/{id}/issue` | `issueInvoice` → `commercial.ts:57` | `IssueInvoiceRequest { payments: [{ paymentMethod, amount }] }` | `Invoice` |
| POST | `/invoices/{id}/payments` | `addInvoicePayment` → `commercial.ts:61` | `CreateInvoicePaymentRequest { paymentMethod, amount }` | `Invoice` |
| POST | `/invoices/{id}/cancel` | `cancelInvoice` → `commercial.ts:65` | — | `Invoice` |
| GET | `/branches/{branchId}/invoices?pageNumber&pageSize` | `getInvoicesByBranch` → `commercial.ts:69` (default 1 / 20) | — | `PagedResult<Invoice>` |
| POST | `/offers` | `createOffer` → `lib/api/offers.ts:4` | `CreateOfferRequest` | `Offer` |
| GET | `/offers/{id}` | `getOffer` → `offers.ts:8` | — | `Offer` |
| POST | `/offers/{id}/send-to-client` | `sendOfferToClient` → `offers.ts:12` | `{}` | `Offer` |
| POST | `/offers/{id}/mark-accepted` | `markOfferAccepted` → `offers.ts:16` | `{}` | `Offer` |
| POST | `/offers/{id}/revert-to-draft` | `revertOfferToDraft` → `offers.ts:20` | `{}` | `Offer` |
| GET | `/offers/{id}/pdf` | `openOfferPdf` → `offers.ts:24` (`responseType: 'blob'`, abre en pestaña nueva) | — | PDF binario |
| POST | `/projects` | `createProject` → `lib/api/projects.ts:4` | `CreateProjectRequest { offerId, branchId, startDate }` | `Project` |
| GET | `/projects/{id}` | `getProject` → `projects.ts:8` | — | `Project` |
| GET | `/workers?pageSize=100` | `getWorkers` → `lib/api/sitelogs.ts:4` | — | `PagedResult<Worker>` → `.items` |
| GET | `/projects/{projectId}/site-logs?pageSize=50` | `getSiteLogsByProject` → `sitelogs.ts:10` | — | `PagedResult<SiteLog>` |
| GET | `/site-logs/{id}` | `getSiteLog` → `sitelogs.ts:16` | — | `SiteLog` |
| POST | `/site-logs` | `createSiteLog` → `sitelogs.ts:20` | `CreateSiteLogRequest` | `SiteLog` |
| POST | `/site-logs/{id}/submit-review` | `submitSiteLogToReview` → `sitelogs.ts:24` | `{}` | `SiteLog` |
| POST | `/site-logs/{id}/approve` | `approveSiteLog` → `sitelogs.ts:28` | `{}` | `SiteLog` |
| POST | `/site-logs/{id}/revert-to-draft` | `revertSiteLogToDraft` → `sitelogs.ts:32` | `{ reason }` | `SiteLog` |
| GET | `/projects/{projectId}/payrolls?pageSize=50` | `getPayrollsByProject` → `lib/api/payroll.ts:4` (**sin uso**) | — | `PagedResult<Payroll>` |
| GET | `/payrolls/{id}` | `getPayroll` → `payroll.ts:10` | — | `Payroll` |
| POST | `/payrolls` | `createPayroll` → `payroll.ts:14` | `CreatePayrollRequest` | `Payroll` |
| POST | `/payrolls/{id}/mark-paid` | `markPayrollPaid` → `payroll.ts:18` | `{}` | `Payroll` |

Total: **47 funciones / endpoints** (43 en uso, 4 sin uso). Las formas completas de cada interfaz están en la sección "Resumen para integración".

Detalles relevantes:
- Las listas usan tamaños fijos (`pageSize` 50/100/20) y la UI nunca pagina: con más registros que ese límite, los datos quedan truncados silenciosamente (catálogos de clientes, productos, sucursales, trabajadores incluidos).
- El manejo de errores es genérico: todas las mutaciones muestran un toast fijo; no se leen los mensajes de validación del backend (`ProblemDetails` u otros).
- React Query: `retry: 1`, `refetchOnWindowFocus: false` (`app/App.tsx:8`).

---

## 5. Autenticación

- **Login:** `LoginPage` → `AuthContext.login()` (`features/auth/auth-context.tsx:18`) → `POST /auth/login`. La respuesta completa (`LoginResponse`: accessToken, refreshToken, expiración, userId, name, email, roles) se guarda como sesión.
- **Almacenamiento:** `localStorage`, clave `lv_auth_session`, JSON (`lib/api/auth-storage.ts:5`). Access **y** refresh token en localStorage (decisión documentada en el spec: aceptado el riesgo de XSS por ser ERP interno). El estado React se inicializa leyendo localStorage.
- **Interceptor de request** (`lib/api/client.ts:12`): agrega `Authorization: Bearer <accessToken>` si hay sesión.
- **Refresh token: sí.** Interceptor de respuesta (`client.ts:36`): ante un 401, si hay refreshToken y la request no se reintentó, hace `POST /auth/refresh-token` con una instancia sin interceptores; el refresh es *single-flight* (`refreshPromise` compartido entre requests concurrentes), guarda la nueva sesión y reintenta la request original. Si el refresh falla → `clearSession()` + `window.location.href = '/login'`. No hay refresh proactivo con `accessTokenExpiresAt` (solo reactivo al 401).
- **Logout:** `POST /auth/logout` sin body (si el backend necesita el refreshToken para revocarlo, no lo recibe) y luego limpia la sesión aunque falle.
- **Guard:** `ProtectedRoute` (`routes/protected-route.tsx`) redirige a `/login` si no hay sesión. Acepta `allowedRoles`, pero **ninguna ruta lo usa**: cualquier usuario autenticado puede abrir cualquier URL. No se valida la expiración del token en el guard (solo presencia).
- **Roles** (`types/roles.ts`): `GeneralManager` (Gerencia), `OperationsDirector` (Dirección de Operaciones), `ProjectAdmin` (Administrador de Proyecto), `BranchAdmin` (Administrador de Sucursal). Vienen como `roles: string[]` en la respuesta de login (no se decodifica el JWT).
- **Permisos en UI** (solo ocultan botones; la autorización real queda en el backend):
  - Presupuestos: matriz `STATUS_ACTIONS` en `features/presupuestos/budget-status.ts` (ProjectAdmin envía a revisión; Gerencia/Dirección aprueban, corrigen, retiran, cancelan, marcan aprobado por cliente). "Crear oferta" solo ProjectAdmin.
  - Ofertas: ProjectAdmin envía al cliente; Gerencia/Dirección aceptan, revierten y crean proyecto.
  - Bitácoras: ProjectAdmin envía y crea planilla; Gerencia/Dirección aprueban/devuelven.
  - Planillas: Gerencia/Dirección marcan pagada.
  - Facturas: Gerencia/Dirección anulan.
  - `BranchAdmin` no tiene ninguna regla específica en el frontend.
- ⚠️ **Bug:** un login con credenciales incorrectas devuelve 401 → el interceptor, al no haber sesión, ejecuta `clearSession()` y `window.location.href = '/login'` (`client.ts:43-46`), lo que **recarga la página** y hace que el toast "Correo o contraseña incorrectos" desaparezca casi de inmediato. Debería excluirse `/auth/login` del manejo global de 401.

---

## 6. Configuración

- Archivos de entorno (convención de Vite, no `environment.*.ts` de Angular):
  - `.env` — **no versionado** (ignorado en `.gitignore:30`). Contiene `VITE_API_BASE_URL`.
  - `.env.example` — versionado, misma única variable, con valor de desarrollo local (puerto 5142, `/api`).
  - No existen `.env.production`, `.env.development` ni `.env.local`.
- Única variable: **`VITE_API_BASE_URL`** (tipada en `src/vite-env.d.ts`). Si falta, axios usa rutas relativas al origen del frontend.
- `vite.config.ts`: plugins react + tailwind, alias `@`. Sin `server.proxy`, sin `base`, sin configuración de build (chunks).
- CORS: según el spec, el backend ya permite `http://localhost:5173` en desarrollo.
- **Producción:** no hay configuración específica. Para desplegar:
  1. Definir `VITE_API_BASE_URL` (en `.env.production` o variable de entorno del CI) **antes** de `npm run build` — se inyecta en tiempo de build, no en runtime.
  2. Servir `dist/` como estático con *fallback* de SPA (todas las rutas → `index.html`), porque se usa `createBrowserRouter`.
  3. Agregar el dominio de producción a `Cors:AllowedOrigins` del backend.
  4. No hay Dockerfile, nginx.conf ni pipeline de CI en el repo.

---

## 7. Estado del build

| Paso | Resultado |
|---|---|
| `npm ci` | ✅ OK — 391 paquetes instalados en 23 s. Reporta **14 vulnerabilidades (3 moderate, 11 high)**. |
| `npm run build` (`tsc -b && vite build`) | ✅ **Compila sin errores de TypeScript.** 2351 módulos, build en ~0.4 s. |
| `npm run lint` (extra) | ✅ 0 errores, 6 warnings. |
| Tests | ❌ **No hay tests** (ni framework, ni script `test`, ni archivos `*.test.*`/`*.spec.*`). |

**Salida del build:** `dist/assets/index-*.js` **792 kB** (243 kB gzip), CSS 71.8 kB (12.5 kB gzip), + fuentes woff/woff2.

**Warning importante del build:**
```
(!) Some chunks are larger than 500 kB after minification. Consider:
- Using dynamic import() to code-split the application
```
→ todo el código va en un único chunk (no hay `lazy()` por ruta).

**Warnings de oxlint:**
```
src/features/auth/auth-context.tsx:40   react(only-export-components)
src/components/ui/button.tsx:58         react(only-export-components)
src/components/ui/badge.tsx:52          react(only-export-components)
src/components/ui/sidebar.tsx:722       react(only-export-components)
src/features/bitacoras/payroll-create-page.tsx:48  react(set-state-in-effect)
src/hooks/use-mobile.ts:14              react(set-state-in-effect)
```

**`npm audit`** (resumen): directas → `axios` 1.19.0 (high: prototype pollution, GHSA-vh66-26gq-q6x8 / GHSA-9fr6-4gfg-395g; arreglable con `npm audit fix`) y `shadcn` (high, por dependencias transitivas de la CLI: ts-morph, fast-glob, micromatch, braces, undici, js-yaml, hono, ip-address, qs, fast-uri, brace-expansion). Las transitivas de `shadcn` solo afectan la CLI en desarrollo, no al bundle; `shadcn` podría moverse a devDependencies (solo se usa `shadcn/tailwind.css` en build).

---

## 8. Git

```
$ git status
On branch master
nothing to commit, working tree clean

$ git remote -v
(sin salida — no hay remotos configurados)

$ git branch -a
* master

$ git log --oneline -10
48885b9 feat: Bitacora semanal -> Planilla module (demo priority 2)
cb5e9c7 feat: Presupuesto -> Oferta (PDF) -> Proyecto module (demo priority 1)
a52c028 fix: show selected label instead of raw value in shadcn Select
2868f77 feat: real login + protected layout + Comercial module (caja/facturación)
17b0df4 feat: apply Obra palette (concrete + brick) and Barlow Condensed / Work Sans
ae70f0d feat: add axios API client with single-flight token refresh
33b5140 feat: add shared types for roles and auth DTOs
6d362d5 chore: install routing, data fetching, forms and table libraries
4c7da91 chore: init shadcn/ui (Base UI, Nova preset) and add core components
e2f1ba9 chore: add Tailwind CSS v4 and @/ path alias
```

**Conclusión:** el proyecto **sí es un repositorio git local**, con una sola rama (`master`) y **sin remoto** (no está subido a GitHub/GitLab ni a ningún servidor). No existe rama `main`. `.env` no está versionado (verificado con `git check-ignore` y `git ls-files`).

---

## 9. Seguridad

Búsqueda de claves, tokens, contraseñas y URLs en `src/`, `index.html`, configs, `.env*` y `docs/`:

- **No se encontraron claves de API, secretos, contraseñas ni tokens hardcodeados** en el código fuente. Las apariciones de "password"/"token" son nombres de campos y tipos.
- URLs encontradas (todas de desarrollo local, no privadas en sentido estricto):
  - `.env.example:1` — URL del backend local (versionado).
  - `.env:1` — URL del backend (no versionado).
  - `docs/superpowers/specs/2026-08-25-frontend-setup-design.md:11` — URLs http/https del backend local.
  - `docs/superpowers/specs/2026-08-25-frontend-setup-design.md:14` — origen local del frontend (CORS).
  - `docs/superpowers/specs/2026-08-25-frontend-setup-design.md:16` — URI pública de esquema de claims de Microsoft (no sensible).
- Observaciones:
  - Access y refresh token en `localStorage` (`src/lib/api/auth-storage.ts:5`) → expuestos ante XSS (riesgo aceptado en el spec).
  - Sin guard de roles en las rutas (§5): la protección depende del backend.
  - `openOfferPdf` crea un `blob:` URL que nunca se revoca (`src/lib/api/offers.ts:26`) — fuga de memoria menor, no de seguridad.
  - Vulnerabilidad *high* en `axios` directo (§7).

---

## 10. Calidad y pendientes

**Código muerto / sin uso**
- Dependencia `@tanstack/react-table` instalada y nunca importada.
- Funciones API sin uso: `getMe`, `updateMe` (`lib/api/auth.ts`), `getBranchInventory` (`lib/api/commercial.ts:21`), `getPayrollsByProject` (`lib/api/payroll.ts:4`).
- Tipos sin uso: `RefreshTokenRequest` (`types/auth.ts:18`), `UserProfile`/`UpdateProfileRequest` (solo los usan las funciones sin uso), `ProjectWorker` (definido, no se muestra).
- Prop `allowedRoles` de `ProtectedRoute` nunca se usa.
- `next-themes` se usa en `sonner.tsx` pero no hay `ThemeProvider` ni selector de tema; el tema oscuro (`.dark` en `index.css`) nunca se activa.

**Archivos de plantilla**
- `README.md` es el README por defecto de la plantilla Vite + React (no describe el proyecto).
- `public/` vacía; sin favicon (el `index.html` no declara ícono).
- `components/ui/sheet.tsx` y `skeleton.tsx` no se usan directamente en features (solo internamente por `sidebar.tsx`).

**TODOs / FIXME:** ninguno en `src/`. Sin `console.log`.

**Duplicación**
- `PagedResult<T>` se define 4 veces (`types/budgets.ts`, `commercial.ts`, `payroll.ts`, `sitelogs.ts`).
- `STATUS_LABEL` de bitácoras duplicado en `sitelogs-list-page.tsx` y `sitelog-detail-page.tsx`; formateo `₡…toLocaleString('es-CR')` repetido en ~25 lugares (no hay helper `formatCRC`).
- La interfaz `Customer` vive dentro de `lib/api/budgets.ts` en vez de `types/`.
- El select "valor → etiqueta" de sucursal/cliente/trabajador se repite en 6 pantallas.

**Componentes grandes**
- `components/ui/sidebar.tsx` 723 líneas (generado por shadcn, aceptable).
- `budget-create-page.tsx` 301 líneas, `offer-create-page.tsx` 240, `invoice-detail-page.tsx` 235, `budget-detail-page.tsx` 230, `cash-register-page.tsx` 224: todo el estado de formulario con `useState` sueltos (14 en `OfferCreatePage`); solo login y caja usan react-hook-form + zod. Candidatos a extraer subcomponentes (capítulo, actividad, línea de factura).

**Bugs / riesgos funcionales**
- Login fallido recarga la página (ver §5).
- **Fechas y zona horaria:** se usa `new Date().toISOString().slice(0, 10)` (UTC) para "hoy" (`offer-create-page.tsx:21`, `offer-detail-page.tsx:36`, `sitelog-create-page.tsx:23,29`). En Costa Rica (UTC-6), después de las 18:00 da el día siguiente; y `new Date('YYYY-MM-DD').toLocaleDateString()` puede mostrar el día anterior si el backend devuelve fechas sin hora.
- `OfferCreatePage` hace `setState` durante el render (`offer-create-page.tsx:56`) y `estimatedDurationWeeks` se inicializa antes de cargar el presupuesto (queda en 4 si no estaba en caché).
- Validaciones mínimas en formularios manuales: se permiten números negativos/vacíos (horas, costos, cantidades) y presupuestos con capítulos/actividades sin nombre.
- Sin `errorElement`/404: una URL inválida o un error de render deja la pantalla de error por defecto de React Router.
- Un 401 dentro de la app hace `window.location.href` (recarga completa) en vez de navegar con el router.

**Responsive**
- Grillas fijas sin breakpoints: `grid-cols-2` en `budget-create-page.tsx:123`, `offer-create-page.tsx:109`, `sitelog-create-page.tsx:96`; `grid-cols-6` por actividad en `budget-create-page.tsx:221` → inutilizable en móvil.
- Filas de controles con anchos fijos sin `flex-wrap`: pago en `invoice-detail-page.tsx:175`, crear proyecto en `offer-detail-page.tsx:147`, líneas de factura y trabajadores.
- Positivo: tablas envueltas en `overflow-x-auto` (`components/ui/table.tsx:9`), sidebar colapsa en móvil (Sheet), login centrado y fluido.

**Accesibilidad**
- Muchos `<Label>` sin `htmlFor` y `<Input>` sin `id` → campos sin nombre accesible en `budget-create-page`, `offer-create-page`, `sitelog-create-page`, `new-invoice-page`, `offer-detail-page`; inputs dentro de tablas (`payroll-create-page`) sin etiqueta.
- Botones "Quitar" repetidos sin contexto (`aria-label`) en listas de líneas/actividades/trabajadores.
- No hay ningún atributo `aria-*` en features/layout; los mensajes de error van solo en toasts (no asociados al campo); estados de carga como texto plano sin `aria-live`.
- Positivo: `lang="es"`, login con `htmlFor`, `autoComplete` y errores inline; componentes Base UI con soporte de teclado.

**Otros**
- Sin code-splitting (bundle de 792 kB).
- Sin tests de ningún tipo.
- Textos en voseo ("Elegí", "Ingresá") — revisar si es el registro deseado para el usuario final en Costa Rica.

---

## Resumen para integración

**Nombre del proyecto:** `lvconstrucciones-frontend` — "LVConstrucciones" (ERP de construcción). React 19 + Vite 8 + TS 6, API REST bajo `VITE_API_BASE_URL` (`/api`), JWT Bearer + refresh token.

**Entidades de negocio que maneja:** usuarios/sesión y roles, clientes (solo id+nombre, lectura), sucursales, productos, inventario por sucursal (solo API, sin UI), cajas registradoras, facturas (+ detalle y pagos), presupuestos (+ capítulos, actividades, historial), ofertas (+ capítulos, PDF), proyectos (+ trabajadores), trabajadores, bitácoras semanales (+ trabajadores/horas), planillas (+ detalles y pagos).

**No maneja (aún):** gestión de clientes, bodega/movimientos de inventario, usuarios, notificaciones, gastos/materiales de proyecto.

### Modelos y campos (de `src/types/*.ts`)

**Auth / Roles** (`types/auth.ts`, `types/roles.ts`)
- `Role`: `'GeneralManager' | 'OperationsDirector' | 'ProjectAdmin' | 'BranchAdmin'`
- `LoginRequest`: email, password
- `LoginResponse` (= `AuthSession`): accessToken, refreshToken, accessTokenExpiresAt, userId, name, email, roles[]
- `RefreshTokenRequest`: refreshToken
- `UserProfile`: id, name, email, status, profilePhotoPath, roles[], createdAt, lastLoginAt
- `UpdateProfileRequest`: name

**Comunes**
- `PagedResult<T>`: items[], totalCount, pageNumber, pageSize
- `Customer` (`lib/api/budgets.ts`): id, name

**Comercial** (`types/commercial.ts`)
- `Branch`: id, name, city, province, status, branchType (`Office | Commercial | Warehouse`)
- `CashRegister`: id, branchId, openedByUserId, openingDate, openingBalance, status (`Open | Closed`), closedByUserId, closingDate, closingBalance, expectedBalance, difference
- `OpenCashRegisterRequest`: branchId, openingBalance
- `CloseCashRegisterRequest`: closingBalance
- `Product`: id, name, description, sku, unitOfMeasure, unitPrice, unitCost, category, status (`PendingValidation | Validated | Rejected`), activeStatus
- Inventario de sucursal (inline): productId, productName, quantity
- `Invoice`: id, branchId, cashRegisterId, customerId, invoiceNumber, date, paymentType (`Contado | Credito`), status (`Draft | Issued | Cancelled`), subtotal, tax, total, createdByUserId, details[], payments[], totalPaid, balance, isFullyPaid
- `InvoiceDetail`: id, productId, productName, quantity, unitPrice, subtotal
- `InvoicePayment`: id, date, amount, paymentMethod (`Efectivo | Tarjeta | Sinpe`), receivedByUserId
- `CreateInvoiceRequest`: branchId, cashRegisterId, customerId, paymentType, details[] (`InvoiceDetailLine`: productId, quantity)
- `CreateInvoicePaymentRequest`: paymentMethod, amount
- `IssueInvoiceRequest`: payments[]

**Presupuestos** (`types/budgets.ts`)
- `Budget`: id, customerId, branchId, name, status (`Draft | Review | Correction | Sent | ClientApproved | Cancelled`), utilityPercentage, indirectCostsTotal, totalBudget, createdByUserId, chapters[]
- `BudgetChapterResponse`: id, name, order, estimatedWeeks, totalChapter, activities[]
- `BudgetActivityResponse`: id, description, materialQuantity, materialCost, laborCost, equipmentCost, totalActivity
- `CreateBudgetRequest`: customerId, branchId, name, utilityPercentage, indirectCostsTotal, chapters[] (`BudgetChapterInput`: name, order, estimatedWeeks, activities[] (`BudgetActivityInput`: description, materialQuantity, materialCost, laborCost, equipmentCost))
- `BudgetHistoryEntry`: id, budgetId, userId, previousStatus, newStatus, comment, reason, timestamp

**Ofertas** (`types/offers.ts`)
- `Offer`: id, budgetId, customerId, offerNumber, offerType (`Turnkey | Percentage`), issueDate, validityDays, workLocation, workScope, estimatedStartDate, estimatedDurationWeeks, estimatedDeliveryDate, paymentTerms, warranties, exclusions, totalProjectPrice, agreedPercentage, paymentFrequency (`Weekly | Biweekly | Monthly | ProgressBased`), status (`Draft | SentToClient | ClientAccepted`), generatedPdfPath, createdByUserId, chapters[]
- `OfferChapter`: id, chapterName, estimatedWeeks, approxMaterialQuantity
- `CreateOfferRequest`: budgetId, offerType, issueDate, validityDays, workLocation, workScope, estimatedStartDate, estimatedDurationWeeks, estimatedDeliveryDate?, paymentTerms, warranties, exclusions, totalProjectPrice?, agreedPercentage?, percentageIncludes?, percentageExcludes?, percentageCalculationMethod?, paymentFrequency

**Proyectos** (`types/projects.ts`)
- `Project`: id, offerId, budgetId, customerId, branchId, projectType (`TurnKey | Percentage` — ojo: distinto casing que `OfferType.Turnkey`), startDate, endDate, weeksCounter, totalWorkedHours, workersUsedCount, materialsUsedCount, currentDirectExpenses, pendingExpenses, currentProfit, status (`Active | Finished | Suspended`), createdByUserId, workers[]
- `ProjectWorker`: id, workerId, workerName
- `CreateProjectRequest`: offerId, branchId, startDate

**Bitácoras** (`types/sitelogs.ts`)
- `Worker`: id, name, hourlyRate
- `SiteLog`: id, projectId, chapterId, weekStart, weekEnd, taskDescription, pendingTasks, totalPayroll, totalMaterials, progressPercentage, status (`Draft | Review | Approved`), createdByUserId, approvedByUserId, workers[]
- `SiteLogWorker`: id, workerId, hoursWorked
- `CreateSiteLogRequest`: projectId, chapterId?, weekStart, weekEnd, taskDescription, pendingTasks?, workers[] (`SiteLogWorkerInput`: workerId, hoursWorked)

**Planillas** (`types/payroll.ts`)
- `Payroll`: id, projectId, siteLogId, chapterId, weekStart, weekEnd, totalPayroll, status (`Pending | Paid`), createdByUserId, paidAt, details[]
- `PayrollDetail`: id, workerId, date, hoursWorked, hourlyRate, paymentType (`Full | Advance | Vacation | Overtime`), advanceAmountApplied, finalAmountToPay, payments[]
- `PayrollDetailPayment`: id, paymentMethod (`Transfer | Cash`), amount
- `CreatePayrollRequest`: siteLogId, chapterId?, details[] (`PayrollDetailInput`: workerId, date, hoursWorked, hourlyRate, paymentType, advanceAmountApplied?, payments[] (`PayrollDetailPaymentInput`: paymentMethod, amount))

**Flujos de estado implementados**
- Presupuesto: Draft → Review → (Correction ↔ Review) → Sent → ClientApproved; Cancelled desde Draft/Review/Correction/Sent.
- Oferta: Draft → SentToClient (genera PDF) → ClientAccepted (o vuelve a Draft) → crea Proyecto.
- Bitácora: Draft → Review → Approved (o vuelve a Draft con motivo) → crea Planilla.
- Planilla: Pending → Paid.
- Factura: Draft → Issued (con pago) → abonos hasta `isFullyPaid`; Cancelled.
- Caja: Open → Closed (backend calcula expectedBalance y difference).
