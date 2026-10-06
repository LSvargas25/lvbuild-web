import type { InvoiceStatus } from '@/types/commercial'
import type { OfferStatus, OfferType, PaymentFrequency } from '@/types/offers'
import type { PaymentMethod, PayrollStatus } from '@/types/payroll'
import type { ProjectStatus } from '@/types/projects'
import type { SiteLogStatus } from '@/types/sitelogs'

export type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline'

interface StatusDisplay {
  label: string
  variant: BadgeVariant
}

export const OFFER_STATUS: Record<OfferStatus, StatusDisplay> = {
  Draft: { label: 'Borrador', variant: 'secondary' },
  SentToClient: { label: 'Enviada al cliente', variant: 'outline' },
  ClientAccepted: { label: 'Aceptada por el cliente', variant: 'default' },
}

export const OFFER_TYPE_LABEL: Record<OfferType, string> = {
  Turnkey: 'Llave en mano',
  Percentage: 'Por porcentaje',
}

export const PAYMENT_FREQUENCY_LABEL: Record<PaymentFrequency, string> = {
  Weekly: 'Semanal',
  Biweekly: 'Quincenal',
  Monthly: 'Mensual',
  ProgressBased: 'Por avance',
}

export const PROJECT_STATUS: Record<ProjectStatus, StatusDisplay> = {
  Active: { label: 'Activo', variant: 'default' },
  Finished: { label: 'Finalizado', variant: 'secondary' },
  Suspended: { label: 'Suspendido', variant: 'destructive' },
}

export const SITE_LOG_STATUS: Record<SiteLogStatus, StatusDisplay> = {
  Draft: { label: 'Borrador', variant: 'secondary' },
  Review: { label: 'En revisión', variant: 'outline' },
  Approved: { label: 'Aprobada', variant: 'default' },
}

export const PAYROLL_STATUS: Record<PayrollStatus, StatusDisplay> = {
  Pending: { label: 'Pendiente', variant: 'secondary' },
  Paid: { label: 'Pagada', variant: 'default' },
}

export const PAYROLL_PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  Cash: 'Efectivo',
  Transfer: 'Transferencia',
}

export const INVOICE_STATUS: Record<InvoiceStatus, StatusDisplay> = {
  Draft: { label: 'Borrador', variant: 'secondary' },
  Issued: { label: 'Emitida', variant: 'default' },
  Cancelled: { label: 'Anulada', variant: 'destructive' },
}
