export type BudgetStatus = 'Draft' | 'Review' | 'Correction' | 'Sent' | 'ClientApproved' | 'Cancelled'

export interface BudgetActivityInput {
  description: string
  materialQuantity: number
  materialCost: number
  laborCost: number
  equipmentCost: number
}

export interface BudgetChapterInput {
  name: string
  order: number
  estimatedWeeks: number
  activities: BudgetActivityInput[]
}

export interface CreateBudgetRequest {
  customerId: number
  branchId: number
  name: string
  utilityPercentage: number
  indirectCostsTotal: number
  chapters: BudgetChapterInput[]
}

export interface BudgetActivityResponse extends BudgetActivityInput {
  id: number
  totalActivity: number
}

export interface BudgetChapterResponse {
  id: number
  name: string
  order: number
  estimatedWeeks: number
  totalChapter: number
  activities: BudgetActivityResponse[]
}

export interface Budget {
  id: number
  customerId: number
  branchId: number
  name: string
  status: BudgetStatus
  utilityPercentage: number
  indirectCostsTotal: number
  totalBudget: number
  createdByUserId: number
  chapters: BudgetChapterResponse[]
}

export interface BudgetHistoryEntry {
  id: number
  budgetId: number
  userId: number
  previousStatus: BudgetStatus | null
  newStatus: BudgetStatus
  comment: string | null
  reason: string | null
  timestamp: string
}
