import { useAuth } from '@/features/auth/auth-context'
import { ROLE_LABELS } from '@/types/roles'

export function HomePage() {
  const { session } = useAuth()

  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-2xl font-semibold">Hola, {session?.name}</h1>
      <p className="text-muted-foreground">
        {session?.roles.map((role) => ROLE_LABELS[role]).join(', ')}
      </p>
    </div>
  )
}
