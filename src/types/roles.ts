export const ROLES = {
  GeneralManager: 'GeneralManager',
  OperationsDirector: 'OperationsDirector',
  ProjectAdmin: 'ProjectAdmin',
  BranchAdmin: 'BranchAdmin',
  BusinessManager: 'BusinessManager',
} as const

export type Role = (typeof ROLES)[keyof typeof ROLES]

export const ROLE_LABELS: Record<Role, string> = {
  GeneralManager: 'Gerencia',
  OperationsDirector: 'Dirección de Operaciones',
  ProjectAdmin: 'Administrador de Proyecto',
  BranchAdmin: 'Administrador de Sucursal',
  BusinessManager: 'Gerencia Comercial',
}

/** Gerencia y Dirección: aprueban, cancelan y deciden en todos los flujos. */
export const MANAGEMENT_ROLES: Role[] = ['GeneralManager', 'OperationsDirector']
