export type ProjectStatus = 'Active' | 'Finished' | 'Suspended'
export type ProjectType = 'TurnKey' | 'Percentage'

export interface CreateProjectRequest {
  offerId: number
  branchId: number
  startDate: string
}

export interface ProjectWorker {
  id: number
  workerId: number
  workerName: string
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
