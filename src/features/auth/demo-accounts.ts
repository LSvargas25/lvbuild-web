import type { Role } from '@/types/roles'

/** Contraseña compartida por los usuarios que siembra el backend con `Seed__Demo=true`. */
export const DEMO_PASSWORD = 'LvBuild#2026'

export interface DemoAccount {
  role: Role
  email: string
  /** Qué puede hacer este rol, en una línea. */
  summary: string
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    role: 'GeneralManager',
    email: 'gerencia@lvbuild.test',
    summary: 'Aprueba presupuestos, acepta ofertas y paga planillas.',
  },
  {
    role: 'OperationsDirector',
    email: 'operaciones@lvbuild.test',
    summary: 'Mismas aprobaciones que Gerencia.',
  },
  {
    role: 'ProjectAdmin',
    email: 'proyectos@lvbuild.test',
    summary: 'Crea presupuestos, ofertas y bitácoras semanales de obra.',
  },
  {
    role: 'BranchAdmin',
    email: 'sucursal@lvbuild.test',
    summary: 'Abre caja y emite facturas.',
  },
  {
    role: 'BusinessManager',
    email: 'comercial@lvbuild.test',
    summary: 'Caja y facturación.',
  },
]
