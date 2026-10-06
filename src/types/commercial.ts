export type BranchType = 'Office' | 'Commercial' | 'Warehouse'

/** Sucursal para listas de selección (`GET /branches/options`). */
export interface BranchOption {
  id: number
  name: string
  branchType: BranchType
}

export type CashRegisterStatus = 'Open' | 'Closed'

export interface CashRegister {
  id: number
  branchId: number
  openedByUserId: number
  openingDate: string
  openingBalance: number
  status: CashRegisterStatus
  closedByUserId: number | null
  closingDate: string | null
  closingBalance: number | null
  expectedBalance: number | null
  difference: number | null
}

export interface OpenCashRegisterRequest {
  branchId: number
  openingBalance: number
}

export interface CloseCashRegisterRequest {
  closingBalance: number
}

export type ProductStatus = 'PendingValidation' | 'Validated' | 'Rejected'

export interface Product {
  id: number
  name: string
  description: string | null
  sku: string | null
  unitOfMeasure: string | null
  unitPrice: number
  unitCost: number
  category: string | null
  status: ProductStatus
  activeStatus: boolean
}

export type InvoiceStatus = 'Draft' | 'Issued' | 'Cancelled'
export type InvoicePaymentMethod = 'Efectivo' | 'Tarjeta' | 'Sinpe'
export type InvoicePaymentType = 'Contado' | 'Credito'

export interface InvoiceDetailLine {
  productId: number
  quantity: number
}

export interface CreateInvoiceRequest {
  branchId: number
  cashRegisterId: number
  customerId: number | null
  paymentType: InvoicePaymentType
  details: InvoiceDetailLine[]
}

export interface InvoiceDetail {
  id: number
  productId: number
  productName: string
  quantity: number
  unitPrice: number
  subtotal: number
}

export interface InvoicePayment {
  id: number
  date: string
  amount: number
  paymentMethod: InvoicePaymentMethod
  receivedByUserId: number
}

export interface CreateInvoicePaymentRequest {
  paymentMethod: InvoicePaymentMethod
  amount: number
}

export interface IssueInvoiceRequest {
  payments: CreateInvoicePaymentRequest[]
}

export interface Invoice {
  id: number
  branchId: number
  cashRegisterId: number
  customerId: number | null
  invoiceNumber: string | null
  date: string
  paymentType: InvoicePaymentType
  status: InvoiceStatus
  subtotal: number
  tax: number
  total: number
  createdByUserId: number
  details: InvoiceDetail[]
  payments: InvoicePayment[]
  totalPaid: number
  balance: number
  isFullyPaid: boolean
}
