import type { BadgeVariant } from '@/lib/status-labels'
import type { BudgetStatus } from '@/types/budgets'
import { MANAGEMENT_ROLES, type Role } from '@/types/roles'

export const STATUS_LABEL: Record<BudgetStatus, string> = {
  Draft: 'Borrador',
  Review: 'En revisión',
  Correction: 'Corrección',
  Sent: 'Enviado',
  ClientApproved: 'Aprobado por cliente',
  Cancelled: 'Cancelado',
}

export const STATUS_VARIANT: Record<BudgetStatus, BadgeVariant> = {
  Draft: 'secondary',
  Review: 'outline',
  Correction: 'destructive',
  Sent: 'default',
  ClientApproved: 'default',
  Cancelled: 'destructive',
}

export type BudgetActionKey =
  | 'submit-for-review'
  | 'approve-internal'
  | 'request-correction'
  | 'withdraw-from-commercial'
  | 'mark-client-approved'
  | 'cancel'

export interface BudgetAction {
  key: BudgetActionKey
  label: string
  roles: Role[]
  variant?: 'default' | 'destructive' | 'outline'
  /** La acción pide un comentario o motivo antes de confirmar. */
  needsComment?: boolean
}

const cancel: BudgetAction = {
  key: 'cancel',
  label: 'Cancelar presupuesto',
  roles: MANAGEMENT_ROLES,
  variant: 'destructive',
  needsComment: true,
}

/** Máquina de estados del presupuesto: qué acción puede tomar cada rol en cada estado. */
export const STATUS_ACTIONS: Record<BudgetStatus, BudgetAction[]> = {
  Draft: [{ key: 'submit-for-review', label: 'Enviar a revisión', roles: ['ProjectAdmin'] }, cancel],
  Review: [
    { key: 'approve-internal', label: 'Aprobar internamente', roles: MANAGEMENT_ROLES },
    {
      key: 'request-correction',
      label: 'Solicitar corrección',
      roles: MANAGEMENT_ROLES,
      variant: 'outline',
      needsComment: true,
    },
    cancel,
  ],
  Correction: [
    { key: 'submit-for-review', label: 'Reenviar a revisión', roles: ['ProjectAdmin'] },
    cancel,
  ],
  Sent: [
    {
      key: 'mark-client-approved',
      label: 'Marcar aprobado por cliente',
      roles: MANAGEMENT_ROLES,
    },
    {
      key: 'withdraw-from-commercial',
      label: 'Retirar de comercial',
      roles: MANAGEMENT_ROLES,
      variant: 'outline',
      needsComment: true,
    },
    cancel,
  ],
  ClientApproved: [],
  Cancelled: [],
}

/** Acciones que los roles del usuario pueden ejecutar sobre un presupuesto en `status`. */
export function availableBudgetActions(status: BudgetStatus, roles: readonly Role[]) {
  return STATUS_ACTIONS[status].filter((action) => action.roles.some((r) => roles.includes(r)))
}

/** Solo Administración de Proyecto crea ofertas, y solo desde un presupuesto enviado. */
export function canCreateOffer(status: BudgetStatus, roles: readonly Role[]) {
  return status === 'Sent' && roles.includes('ProjectAdmin')
}
