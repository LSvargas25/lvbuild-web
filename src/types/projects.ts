export type ProjectStatus = 'Active' | 'Finished' | 'Suspended'
export type ProjectType = 'TurnKey' | 'Percentage'
export type FinancePeriod = 'Week' | 'Month' | 'Year'

export interface CreateProjectRequest {
  offerId: number
  branchId: number
  startDate: string
}

export interface ProjectWorker {
  id: number
  workerId: number
  assignedAt: string
  assignedByUserId: number
  isActive: boolean
}

export interface Project {
  id: number
  offerId: number
  budgetId: number
  customerId: number
  branchId: number
  projectType: ProjectType
  startDate: string
  endDate: string
  weeksCounter: number
  totalWorkedHours: number
  workersUsedCount: number
  materialsUsedCount: number
  currentDirectExpenses: number
  pendingExpenses: number
  currentProfit: number
  status: ProjectStatus
  createdByUserId: number
  workers: ProjectWorker[]
}

/** Costo real por capítulo frente a lo vendido (`GET /projects/{id}/chapters`). */
export interface ProjectChapter {
  id: number
  projectId: number
  /** Id del capítulo del presupuesto. */
  chapterId: number
  assignedSoldTotal: number
  actualCostTotal: number
  chapterProfit: number
  incidentCount: number
  incidentPercentage: number | null
}

export interface ProjectFinanceMaterial {
  materialName: string
  supplierName: string
  quantity: number
  total: number
  date: string
}

/** Gastos del proyecto en un periodo (`GET /projects/{id}/finance`). */
export interface ProjectFinance {
  projectId: number
  period: FinancePeriod
  periodStart: string
  periodEnd: string
  currentDirectExpenses: number
  pendingExpenses: number
  totalHoursWorked: number
  materials: ProjectFinanceMaterial[]
}
