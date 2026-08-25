export type OfferStatus = 'Draft' | 'SentToClient' | 'ClientAccepted'
export type OfferType = 'Turnkey' | 'Percentage'
export type PaymentFrequency = 'Weekly' | 'Biweekly' | 'Monthly' | 'ProgressBased'

export interface CreateOfferRequest {
  budgetId: number
  offerType: OfferType
  issueDate: string
  validityDays: number
  workLocation: string
  workScope: string
  estimatedStartDate: string
  estimatedDurationWeeks: number
  estimatedDeliveryDate?: string | null
  paymentTerms: string
  warranties: string
  exclusions: string
  totalProjectPrice?: number | null
  agreedPercentage?: number | null
  percentageIncludes?: string | null
  percentageExcludes?: string | null
  percentageCalculationMethod?: string | null
  paymentFrequency: PaymentFrequency | null
}

export interface OfferChapter {
  id: number
  chapterName: string
  estimatedWeeks: number
  approxMaterialQuantity: number | null
}

export interface Offer {
  id: number
  budgetId: number
  customerId: number
  offerNumber: string | null
  offerType: OfferType
  issueDate: string
  validityDays: number
  workLocation: string | null
  workScope: string | null
  estimatedStartDate: string
  estimatedDurationWeeks: number
  estimatedDeliveryDate: string | null
  paymentTerms: string | null
  warranties: string | null
  exclusions: string | null
  totalProjectPrice: number | null
  agreedPercentage: number | null
  paymentFrequency: PaymentFrequency
  status: OfferStatus
  generatedPdfPath: string | null
  createdByUserId: number
  chapters: OfferChapter[]
}
