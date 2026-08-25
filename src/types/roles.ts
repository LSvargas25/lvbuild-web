export const ROLES = {
  GeneralManager: 'GeneralManager',
  OperationsDirector: 'OperationsDirector',
  ProjectAdmin: 'ProjectAdmin',
  BranchAdmin: 'BranchAdmin',
} as const

export type Role = (typeof ROLES)[keyof typeof ROLES]

export const ROLE_LABELS: Record<Role, string> = {
  GeneralManager: 'Gerencia',
  OperationsDirector: 'Dirección de Operaciones',
  ProjectAdmin: 'Administrador de Proyecto',
  BranchAdmin: 'Administrador de Sucursal',
}
