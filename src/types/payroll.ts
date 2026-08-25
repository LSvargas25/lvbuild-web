export type PayrollStatus = 'Pending' | 'Paid'
export type PayrollPaymentType = 'Full' | 'Advance' | 'Vacation' | 'Overtime'
export type PaymentMethod = 'Transfer' | 'Cash'

export interface PayrollDetailPaymentInput {
  paymentMethod: PaymentMethod
  amount: number
}

export interface PayrollDetailInput {
  workerId: number
  date: string
  hoursWorked: number
  hourlyRate: number
  paymentType: PayrollPaymentType
  advanceAmountApplied?: number | null
  payments: PayrollDetailPaymentInput[]
}

export interface CreatePayrollRequest {
  siteLogId: number
  chapterId?: number | null
  details: PayrollDetailInput[]
}

export interface PayrollDetailPayment {
  id: number
  paymentMethod: PaymentMethod
  amount: number
}

export interface PayrollDetail {
  id: number
  workerId: number
  date: string
  hoursWorked: number
  hourlyRate: number
  paymentType: PayrollPaymentType
  advanceAmountApplied: number | null
  finalAmountToPay: number
  payments: PayrollDetailPayment[]
}

export interface Payroll {
  id: number
  projectId: number
  siteLogId: number
  chapterId: number | null
  weekStart: string
  weekEnd: string
  totalPayroll: number
  status: PayrollStatus
  createdByUserId: number
  paidAt: string | null
  details: PayrollDetail[]
}

export interface PagedResult<T> {
  items: T[]
  totalCount: number
  pageNumber: number
  pageSize: number
}
