import { createBrowserRouter } from 'react-router-dom'
import { HomePage } from '@/app/home-page'
import { AppLayout } from '@/components/layout/app-layout'
import { CashRegisterPage } from '@/features/comercial/cash-register-page'
import { InvoiceDetailPage } from '@/features/comercial/invoice-detail-page'
import { InvoicesListPage } from '@/features/comercial/invoices-list-page'
import { NewInvoicePage } from '@/features/comercial/new-invoice-page'
import { LoginPage } from '@/features/auth/login-page'
import { BudgetCreatePage } from '@/features/presupuestos/budget-create-page'
import { BudgetDetailPage } from '@/features/presupuestos/budget-detail-page'
import { BudgetsListPage } from '@/features/presupuestos/budgets-list-page'
import { OfferCreatePage } from '@/features/presupuestos/offer-create-page'
import { OfferDetailPage } from '@/features/presupuestos/offer-detail-page'
import { ProjectDetailPage } from '@/features/presupuestos/project-detail-page'
import { ProtectedRoute } from '@/routes/protected-route'

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <HomePage /> },
          { path: 'comercial/caja', element: <CashRegisterPage /> },
          { path: 'comercial/facturas', element: <InvoicesListPage /> },
          { path: 'comercial/facturas/nueva', element: <NewInvoicePage /> },
          { path: 'comercial/facturas/:id', element: <InvoiceDetailPage /> },
          { path: 'presupuestos', element: <BudgetsListPage /> },
          { path: 'presupuestos/nuevo', element: <BudgetCreatePage /> },
          { path: 'presupuestos/:id', element: <BudgetDetailPage /> },
          { path: 'presupuestos/:budgetId/oferta', element: <OfferCreatePage /> },
          { path: 'ofertas/:id', element: <OfferDetailPage /> },
          { path: 'proyectos/:id', element: <ProjectDetailPage /> },
        ],
      },
    ],
  },
])
