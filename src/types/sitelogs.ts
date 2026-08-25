export type SiteLogStatus = 'Draft' | 'Review' | 'Approved'

export interface SiteLogWorkerInput {
  workerId: number
  hoursWorked: number
}

export interface CreateSiteLogRequest {
  projectId: number
  chapterId?: number | null
  weekStart: string
  weekEnd: string
  taskDescription: string
  pendingTasks?: string | null
  workers: SiteLogWorkerInput[]
}

export interface SiteLogWorker {
  id: number
  workerId: number
  hoursWorked: number
}

export interface SiteLog {
  id: number
  projectId: number
  chapterId: number | null
  weekStart: string
  weekEnd: string
  taskDescription: string | null
  pendingTasks: string | null
  totalPayroll: number
  totalMaterials: number
  progressPercentage: number | null
  status: SiteLogStatus
  createdByUserId: number
  approvedByUserId: number | null
  workers: SiteLogWorker[]
}

export interface Worker {
  id: number
  name: string
  hourlyRate: number
}

export interface PagedResult<T> {
  items: T[]
  totalCount: number
  pageNumber: number
  pageSize: number
}
