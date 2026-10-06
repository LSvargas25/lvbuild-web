import { describe, expect, it } from 'vitest'
import {
  STATUS_ACTIONS,
  availableBudgetActions,
  canCreateOffer,
  type BudgetActionKey,
} from '@/features/presupuestos/budget-status'
import type { BudgetStatus } from '@/types/budgets'
import type { Role } from '@/types/roles'

const keys = (status: BudgetStatus, roles: Role[]) =>
  availableBudgetActions(status, roles).map((action) => action.key)

describe('availableBudgetActions', () => {
  const matrix: [BudgetStatus, Role, BudgetActionKey[]][] = [
    ['Draft', 'ProjectAdmin', ['submit-for-review']],
    ['Draft', 'GeneralManager', ['cancel']],
    ['Review', 'ProjectAdmin', []],
    ['Review', 'GeneralManager', ['approve-internal', 'request-correction', 'cancel']],
    ['Review', 'OperationsDirector', ['approve-internal', 'request-correction', 'cancel']],
    ['Correction', 'ProjectAdmin', ['submit-for-review']],
    ['Correction', 'OperationsDirector', ['cancel']],
    ['Sent', 'ProjectAdmin', []],
    ['Sent', 'GeneralManager', ['mark-client-approved', 'withdraw-from-commercial', 'cancel']],
    ['ClientApproved', 'GeneralManager', []],
    ['Cancelled', 'GeneralManager', []],
    ['Review', 'BranchAdmin', []],
    ['Sent', 'BusinessManager', []],
  ]

  it.each(matrix)('%s + %s -> %j', (status, role, expected) => {
    expect(keys(status, [role])).toEqual(expected)
  })

  it('combines the actions of every role the user has', () => {
    expect(keys('Draft', ['ProjectAdmin', 'GeneralManager'])).toEqual(['submit-for-review', 'cancel'])
  })

  it('asks for a comment on every action that sends a message back', () => {
    const withComment = Object.values(STATUS_ACTIONS)
      .flat()
      .filter((a) => a.needsComment)
      .map((a) => a.key)
    expect(new Set(withComment)).toEqual(new Set(['cancel', 'request-correction', 'withdraw-from-commercial']))
  })

  it('has no actions on final states', () => {
    expect(STATUS_ACTIONS.ClientApproved).toEqual([])
    expect(STATUS_ACTIONS.Cancelled).toEqual([])
  })
})

describe('canCreateOffer', () => {
  it('only lets project admins create offers from sent budgets', () => {
    expect(canCreateOffer('Sent', ['ProjectAdmin'])).toBe(true)
    expect(canCreateOffer('Sent', ['GeneralManager'])).toBe(false)
    expect(canCreateOffer('Review', ['ProjectAdmin'])).toBe(false)
  })
})
