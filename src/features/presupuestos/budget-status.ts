import type { BudgetStatus } from '@/types/budgets'
import type { Role } from '@/types/roles'

export const STATUS_LABEL: Record<BudgetStatus, string> = {
  Draft: 'Borrador',
  Review: 'En revisión',
  Correction: 'Corrección',
  Sent: 'Enviado',
  ClientApproved: 'Aprobado por cliente',
  Cancelled: 'Cancelado',
}

export const STATUS_VARIANT: Record<
  BudgetStatus,
  'secondary' | 'default' | 'destructive' | 'outline'
> = {
  Draft: 'secondary',
  Review: 'outline',
  Correction: 'destructive',
  Sent: 'default',
  ClientApproved: 'default',
  Cancelled: 'destructive',
}

export interface BudgetAction {
  key: 'submit-for-review' | 'approve-internal' | 'request-correction' | 'withdraw-from-commercial' | 'mark-client-approved' | 'cancel'
  label: string
  roles: Role[]
  variant?: 'default' | 'destructive' | 'outline'
  needsComment?: boolean
}

export const STATUS_ACTIONS: Record<BudgetStatus, BudgetAction[]> = {
  Draft: [
    { key: 'submit-for-review', label: 'Enviar a revisión', roles: ['ProjectAdmin'] },
    {
      key: 'cancel',
      label: 'Cancelar',
      roles: ['GeneralManager', 'OperationsDirector'],
      variant: 'destructive',
      needsComment: true,
    },
  ],
  Review: [
    {
      key: 'approve-internal',
      label: 'Aprobar internamente',
      roles: ['GeneralManager', 'OperationsDirector'],
    },
    {
      key: 'request-correction',
      label: 'Solicitar corrección',
      roles: ['GeneralManager', 'OperationsDirector'],
      variant: 'outline',
      needsComment: true,
    },
    {
      key: 'cancel',
      label: 'Cancelar',
      roles: ['GeneralManager', 'OperationsDirector'],
      variant: 'destructive',
      needsComment: true,
    },
  ],
  Correction: [
    { key: 'submit-for-review', label: 'Reenviar a revisión', roles: ['ProjectAdmin'] },
    {
      key: 'cancel',
      label: 'Cancelar',
      roles: ['GeneralManager', 'OperationsDirector'],
      variant: 'destructive',
      needsComment: true,
    },
  ],
  Sent: [
    {
      key: 'mark-client-approved',
      label: 'Marcar aprobado por cliente',
      roles: ['GeneralManager', 'OperationsDirector'],
    },
    {
      key: 'withdraw-from-commercial',
      label: 'Retirar de comercial',
      roles: ['GeneralManager', 'OperationsDirector'],
      variant: 'outline',
      needsComment: true,
    },
    {
      key: 'cancel',
      label: 'Cancelar',
      roles: ['GeneralManager', 'OperationsDirector'],
      variant: 'destructive',
      needsComment: true,
    },
  ],
  ClientApproved: [],
  Cancelled: [],
}
