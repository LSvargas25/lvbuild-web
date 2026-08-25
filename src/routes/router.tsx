import { createBrowserRouter } from 'react-router-dom'
import { HomePage } from '@/app/home-page'
import { AppLayout } from '@/components/layout/app-layout'
import { CashRegisterPage } from '@/features/comercial/cash-register-page'
import { InvoiceDetailPage } from '@/features/comercial/invoice-detail-page'
import { InvoicesListPage } from '@/features/comercial/invoices-list-page'
import { NewInvoicePage } from '@/features/comercial/new-invoice-page'
import { LoginPage } from '@/features/auth/login-page'
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
        ],
      },
    ],
  },
])
