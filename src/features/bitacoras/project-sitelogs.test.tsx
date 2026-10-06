import { screen, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'
import { ProjectSiteLogs } from '@/features/bitacoras/project-sitelogs'
import { formatCRC } from '@/lib/format'
import { renderRoute, signIn } from '@/test/render'
import { API, server } from '@/test/server'

// Testing Library colapsa los espacios (formatCRC usa espacios no separables).
const crc = (value: number) => formatCRC(value).replace(/\s+/g, ' ')

const page = <T,>(items: T[]) => ({ items, totalCount: items.length, pageNumber: 1, pageSize: 100 })

const siteLog = (id: number, weekStart: string, status: string) => ({
  id,
  projectId: 1,
  chapterId: 1,
  weekStart,
  weekEnd: weekStart,
  taskDescription: `Semana ${id}`,
  pendingTasks: null,
  // La API solo llena totalPayroll al pagar la planilla.
  totalPayroll: 0,
  totalMaterials: 0,
  progressPercentage: null,
  status,
  createdByUserId: 1,
  approvedByUserId: null,
  workers: [],
})

const payroll = (id: number, siteLogId: number, totalPayroll: number, status: string) => ({
  id,
  projectId: 1,
  siteLogId,
  chapterId: 1,
  weekStart: '2026-09-21',
  weekEnd: '2026-09-27',
  totalPayroll,
  status,
  createdByUserId: 1,
  paidAt: status === 'Paid' ? '2026-10-02T21:00:00Z' : null,
  details: [],
})

beforeEach(() => {
  signIn(['GeneralManager'])
  server.use(
    http.get(`${API}/projects/1/site-logs`, () =>
      HttpResponse.json(
        page([
          siteLog(10, '2026-09-14', 'Approved'),
          siteLog(11, '2026-09-21', 'Approved'),
          siteLog(12, '2026-09-28', 'Review'),
        ]),
      ),
    ),
    http.get(`${API}/projects/1/payrolls`, () =>
      HttpResponse.json(page([payroll(1, 10, 1_123_200, 'Paid'), payroll(2, 11, 1_123_200, 'Pending')])),
    ),
  )
})

describe('ProjectSiteLogs', () => {
  it('shows each payroll amount with its status, including pending ones', async () => {
    renderRoute(<ProjectSiteLogs projectId={1} canCreate={false} />, { route: '/', path: '/' })

    const paidRow = (await screen.findByText('Semana 10')).closest('tr')!
    const pendingRow = screen.getByText('Semana 11').closest('tr')!
    const reviewRow = screen.getByText('Semana 12').closest('tr')!

    expect(await within(pendingRow).findByText('Pendiente')).toBeInTheDocument()
    expect(within(pendingRow).getByText(crc(1_123_200))).toBeInTheDocument()
    expect(within(paidRow).getByText('Pagada')).toBeInTheDocument()
    expect(within(paidRow).getByRole('link', { name: /Pagada/ })).toHaveAttribute('href', '/planillas/1')
    expect(within(reviewRow).getByText('Sin planilla')).toBeInTheDocument()
    expect(screen.queryByText(crc(0))).not.toBeInTheDocument()
  })
})
