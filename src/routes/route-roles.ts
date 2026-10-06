import { MANAGEMENT_ROLES, type Role } from '@/types/roles'

/** Caja y facturación: gerencia, dirección y quienes administran sucursales o ventas. */
export const COMMERCIAL_ROLES: Role[] = [...MANAGEMENT_ROLES, 'BranchAdmin', 'BusinessManager']

/** Crear presupuestos, ofertas, bitácoras y planillas. */
export const PROJECT_ADMIN_ROLES: Role[] = ['ProjectAdmin']
