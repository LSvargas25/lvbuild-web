import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import { ServerWakeup } from '@/components/server-wakeup'
import { Toaster } from '@/components/ui/sonner'
import { AuthProvider } from '@/features/auth/auth-provider'
import { createQueryClient } from '@/lib/query-client'
import { router } from '@/routes/router'

const queryClient = createQueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ServerWakeup />
      <AuthProvider>
        <RouterProvider router={router} />
        <Toaster richColors closeButton />
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
