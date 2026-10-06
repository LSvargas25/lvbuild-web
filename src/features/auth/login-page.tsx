import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import axios from 'axios'
import { Building2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { FormField } from '@/components/form-field'
import { fieldA11y } from '@/lib/a11y'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/features/auth/auth-context'
import { getErrorMessage } from '@/lib/api/errors'

const loginSchema = z.object({
  email: z.email('Ingresa un correo válido'),
  password: z.string().min(1, 'Ingresa tu contraseña'),
})

type LoginFormValues = z.infer<typeof loginSchema>

function loginErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status
    // La API responde 403 a credenciales inválidas y a cuentas bloqueadas (mensajes en inglés).
    if (status === 401 || status === 403) {
      const message = (error.response?.data as { message?: string } | undefined)?.message ?? ''
      return /blocked/i.test(message)
        ? 'Esta cuenta está bloqueada. Contacta a un administrador.'
        : 'Correo o contraseña incorrectos.'
    }
    if (status === 429) return 'Demasiados intentos. Espera un minuto y vuelve a intentarlo.'
  }
  return getErrorMessage(error, 'No se pudo iniciar sesión. Intenta de nuevo.')
}

export function LoginPage() {
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/'

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) })

  const mutation = useMutation({
    mutationFn: (values: LoginFormValues) => login(values),
    onSuccess: () => navigate(from, { replace: true }),
  })

  if (isAuthenticated && !mutation.isSuccess) {
    return <Navigate to={from} replace />
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <div className="mb-2 flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Building2 className="size-5" aria-hidden="true" />
          </div>
          <CardTitle>
            <h1 className="text-xl">Iniciar sesión</h1>
          </CardTitle>
          <CardDescription>LvBuild · ERP de LV Construcciones</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit((values) => mutation.mutate(values))}
            className="flex flex-col gap-4"
            noValidate
          >
            <FormField id="email" label="Correo" error={errors.email?.message}>
              <Input
                type="email"
                autoComplete="username"
                {...fieldA11y('email', errors.email?.message)}
                {...register('email')}
              />
            </FormField>
            <FormField id="password" label="Contraseña" error={errors.password?.message}>
              <Input
                type="password"
                autoComplete="current-password"
                {...fieldA11y('password', errors.password?.message)}
                {...register('password')}
              />
            </FormField>
            {mutation.isError && (
              <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {loginErrorMessage(mutation.error)}
              </p>
            )}
            <Button type="submit" disabled={mutation.isPending} className="mt-2">
              {mutation.isPending ? 'Ingresando…' : 'Ingresar'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
