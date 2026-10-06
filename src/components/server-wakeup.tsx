import { useQueryClient } from '@tanstack/react-query'
import { Loader2Icon, RefreshCwIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { pingApi } from '@/lib/api/health'

/** Esperas entre pings: ≈ 85 s en total, más que un arranque en frío de Render (~50 s). */
const WAKEUP_DELAYS_MS = [1000, 2000, 4000, 8000, 10_000, 10_000, 10_000, 10_000, 10_000, 10_000, 10_000]

// Un servidor despierto responde en menos de esto: así el aviso no parpadea en cada carga.
const SHOW_NOTICE_AFTER_MS = 1500

type Status = 'checking' | 'waking' | 'ready' | 'unreachable'

interface ServerWakeupProps {
  ping?: () => Promise<boolean>
  delaysMs?: number[]
  showNoticeAfterMs?: number
}

/**
 * Al cargar la app hace ping a la API. Si está dormida (plan gratuito de Render) muestra un
 * aviso mientras despierta y, cuando responde, vuelve a pedir lo que haya fallado mientras tanto.
 */
export function ServerWakeup({
  ping = pingApi,
  delaysMs = WAKEUP_DELAYS_MS,
  showNoticeAfterMs = SHOW_NOTICE_AFTER_MS,
}: ServerWakeupProps) {
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<Status>('checking')
  const [run, setRun] = useState(0)
  const wasAsleep = useRef(false)

  useEffect(() => {
    let cancelled = false
    const markWaking = () => {
      wasAsleep.current = true
      setStatus('waking')
    }
    const slowTimer = setTimeout(markWaking, showNoticeAfterMs)

    async function wake() {
      for (let attempt = 0; ; attempt++) {
        const ok = await ping()
        if (cancelled) return
        if (ok) {
          clearTimeout(slowTimer)
          setStatus('ready')
          if (wasAsleep.current) {
            // Las consultas que agotaron sus reintentos antes de que la API despertara.
            void queryClient.refetchQueries({ predicate: (query) => query.state.status === 'error' })
          }
          return
        }
        markWaking()
        if (attempt >= delaysMs.length) {
          setStatus('unreachable')
          return
        }
        await new Promise((resolve) => setTimeout(resolve, delaysMs[attempt]))
        if (cancelled) return
      }
    }

    void wake()
    return () => {
      cancelled = true
      clearTimeout(slowTimer)
    }
  }, [run, ping, delaysMs, showNoticeAfterMs, queryClient])

  if (status === 'waking') {
    return (
      <Notice role="status">
        <Loader2Icon className="size-4 animate-spin" aria-hidden="true" />
        Despertando el servidor, puede tardar hasta un minuto…
      </Notice>
    )
  }

  if (status === 'unreachable') {
    return (
      <Notice role="alert">
        No se pudo conectar con el servidor.
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setStatus('checking')
            setRun((r) => r + 1)
          }}
        >
          <RefreshCwIcon aria-hidden="true" /> Reintentar
        </Button>
      </Notice>
    )
  }

  return null
}

function Notice({ role, children }: { role: 'status' | 'alert'; children: React.ReactNode }) {
  return (
    <div
      role={role}
      aria-live="polite"
      className="fixed inset-x-0 top-0 z-50 flex items-center justify-center gap-2 border-b bg-amber-50 px-4 py-2 text-sm text-amber-900 shadow-sm dark:bg-amber-950 dark:text-amber-100"
    >
      {children}
    </div>
  )
}
