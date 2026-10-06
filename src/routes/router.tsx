import { createBrowserRouter, type RouteObject } from 'react-router-dom'
import { LoadingState } from '@/components/page-state'
import { LegacySiteLogsRedirect, NotFoundPage, RouteErrorPage } from '@/routes/error-pages'
import { ProtectedRoute } from '@/routes/protected-route'
import { COMMERCIAL_ROLES, PROJECT_ADMIN_ROLES } from '@/routes/route-roles'

// Cada pantalla se carga en su propio chunk (code splitting por ruta).
const page = (load: () => Promise<{ Component: React.ComponentType }>): Pick<RouteObject, 'lazy'> => ({
  lazy: load,
})

export const routes: RouteObject[] = [
  {
    errorElement: <RouteErrorPage />,
    hydrateFallbackElement: <LoadingState />,
    children: [
      {
        path: '/login',
        ...page(() => import('@/features/auth/login-page').then((m) => ({ Component: m.LoginPage }))),
      },
      {
        element: <ProtectedRoute />,
        children: [
          {
            ...page(() =>
              import('@/components/layout/app-layout').then((m) => ({ Component: m.AppLayout })),
            ),
            children: [
              {
                errorElement: <RouteErrorPage />,
                children: [
                  {
                    index: true,
                    ...page(() =>
                      import('@/features/dashboard/dashboard-page').then((m) => ({ Component: m.DashboardPage })),
                    ),
                  },
                  {
                    path: 'presupuestos',
                    ...page(() =>
                      import('@/features/presupuestos/budgets-list-page').then((m) => ({
                        Component: m.BudgetsListPage,
                      })),
                    ),
                  },
                  {
                    path: 'presupuestos/:id',
                    ...page(() =>
                      import('@/features/presupuestos/budget-detail-page').then((m) => ({
                        Component: m.BudgetDetailPage,
                      })),
                    ),
                  },
                  {
                    path: 'ofertas/:id',
                    ...page(() =>
                      import('@/features/presupuestos/offer-detail-page').then((m) => ({
                        Component: m.OfferDetailPage,
                      })),
                    ),
                  },
                  {
                    path: 'proyectos',
                    ...page(() =>
                      import('@/features/proyectos/projects-list-page').then((m) => ({
                        Component: m.ProjectsListPage,
                      })),
                    ),
                  },
                  {
                    path: 'proyectos/:id',
                    ...page(() =>
                      import('@/features/proyectos/project-detail-page').then((m) => ({
                        Component: m.ProjectDetailPage,
                      })),
                    ),
                  },
                  { path: 'proyectos/:projectId/bitacoras', element: <LegacySiteLogsRedirect /> },
                  {
                    path: 'bitacoras/:id',
                    ...page(() =>
                      import('@/features/bitacoras/sitelog-detail-page').then((m) => ({
                        Component: m.SiteLogDetailPage,
                      })),
                    ),
                  },
                  {
                    path: 'planillas/:id',
                    ...page(() =>
                      import('@/features/bitacoras/payroll-detail-page').then((m) => ({
                        Component: m.PayrollDetailPage,
                      })),
                    ),
                  },
                  {
                    element: <ProtectedRoute allowedRoles={PROJECT_ADMIN_ROLES} />,
                    children: [
                      {
                        path: 'presupuestos/nuevo',
                        ...page(() =>
                          import('@/features/presupuestos/budget-create-page').then((m) => ({
                            Component: m.BudgetCreatePage,
                          })),
                        ),
                      },
                      {
                        path: 'presupuestos/:budgetId/oferta',
                        ...page(() =>
                          import('@/features/presupuestos/offer-create-page').then((m) => ({
                            Component: m.OfferCreatePage,
                          })),
                        ),
                      },
                      {
                        path: 'proyectos/:projectId/bitacoras/nueva',
                        ...page(() =>
                          import('@/features/bitacoras/sitelog-create-page').then((m) => ({
                            Component: m.SiteLogCreatePage,
                          })),
                        ),
                      },
                      {
                        path: 'bitacoras/:siteLogId/planilla',
                        ...page(() =>
                          import('@/features/bitacoras/payroll-create-page').then((m) => ({
                            Component: m.PayrollCreatePage,
                          })),
                        ),
                      },
                    ],
                  },
                  {
                    element: <ProtectedRoute allowedRoles={COMMERCIAL_ROLES} />,
                    children: [
                      {
                        path: 'comercial/caja',
                        ...page(() =>
                          import('@/features/comercial/cash-register-page').then((m) => ({
                            Component: m.CashRegisterPage,
                          })),
                        ),
                      },
                      {
                        path: 'comercial/facturas',
                        ...page(() =>
                          import('@/features/comercial/invoices-list-page').then((m) => ({
                            Component: m.InvoicesListPage,
                          })),
                        ),
                      },
                      {
                        path: 'comercial/facturas/nueva',
                        ...page(() =>
                          import('@/features/comercial/new-invoice-page').then((m) => ({
                            Component: m.NewInvoicePage,
                          })),
                        ),
                      },
                      {
                        path: 'comercial/facturas/:id',
                        ...page(() =>
                          import('@/features/comercial/invoice-detail-page').then((m) => ({
                            Component: m.InvoiceDetailPage,
                          })),
                        ),
                      },
                    ],
                  },
                  { path: '*', element: <NotFoundPage /> },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
]

export const router = createBrowserRouter(routes)
