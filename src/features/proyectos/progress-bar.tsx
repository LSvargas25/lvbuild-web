import { cn } from '@/lib/utils'

interface ProgressBarProps {
  /** 0-100; valores mayores se muestran llenos. */
  value: number
  label: string
  className?: string
  tone?: 'default' | 'danger'
}

export function ProgressBar({ value, label, className, tone = 'default' }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value))
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(value)}
        className="h-2 flex-1 overflow-hidden rounded-full bg-muted"
      >
        <div
          className={cn('h-full rounded-full', tone === 'danger' ? 'bg-destructive' : 'bg-primary')}
          style={{ width: `${clamped}%` }}
        />
      </div>
      <span className="w-10 text-right text-xs tabular-nums text-muted-foreground">
        {Math.round(value)} %
      </span>
    </div>
  )
}
