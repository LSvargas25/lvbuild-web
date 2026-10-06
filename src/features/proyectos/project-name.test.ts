import { describe, expect, it } from 'vitest'
import { projectName } from './project-name'

describe('projectName', () => {
  it('usa el nombre que manda la API', () => {
    expect(projectName({ id: 1, name: 'Residencia Familia Mora' }, 'Otro')).toBe('Residencia Familia Mora')
  })

  it('cae al nombre del presupuesto si la API no trae nombre', () => {
    expect(projectName({ id: 1, name: '' }, 'Residencia Familia Mora')).toBe('Residencia Familia Mora')
    expect(projectName({ id: 1 }, 'Residencia Familia Mora')).toBe('Residencia Familia Mora')
  })

  it('solo muestra el número cuando no hay ningún nombre', () => {
    expect(projectName({ id: 7 })).toBe('Proyecto #7')
  })
})
