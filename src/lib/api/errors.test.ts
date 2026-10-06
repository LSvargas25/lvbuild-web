import { AxiosError, AxiosHeaders } from 'axios'
import { describe, expect, it } from 'vitest'
import { getErrorMessage } from '@/lib/api/errors'

function axiosError(status: number | null, data?: unknown) {
  const config = { headers: new AxiosHeaders() }
  return new AxiosError(
    'Request failed',
    undefined,
    config,
    undefined,
    status === null ? undefined : { status, statusText: '', headers: {}, config, data },
  )
}

describe('getErrorMessage', () => {
  it('uses the message from the API error middleware', () => {
    expect(getErrorMessage(axiosError(400, { statusCode: 400, message: 'El SKU ya existe.' }), 'x')).toBe(
      'El SKU ya existe.',
    )
  })

  it('joins ASP.NET Core ProblemDetails validation errors', () => {
    const error = axiosError(400, {
      title: 'One or more validation errors occurred.',
      errors: { Name: ['El nombre es obligatorio.'], Weeks: ['Debe ser mayor que 0.'] },
    })
    expect(getErrorMessage(error, 'x')).toBe('El nombre es obligatorio. Debe ser mayor que 0.')
  })

  it('explains network failures and missing permissions', () => {
    expect(getErrorMessage(axiosError(null), 'x')).toMatch(/conectar con el servidor/)
    expect(getErrorMessage(axiosError(403), 'x')).toBe('No tienes permiso para realizar esta acción.')
  })

  it('falls back for anything else', () => {
    expect(getErrorMessage(axiosError(500), 'No se pudo guardar.')).toBe('No se pudo guardar.')
    expect(getErrorMessage(new Error('boom'), 'No se pudo guardar.')).toBe('No se pudo guardar.')
  })

  it('translates English messages that older backends or default validators send', () => {
    expect(getErrorMessage(axiosError(404, { statusCode: 404, message: 'Project 123 not found.' }), 'x')).toBe(
      'No se encontró el proyecto 123.',
    )
    expect(getErrorMessage(axiosError(401, { message: 'Invalid email or password.' }), 'x')).toBe(
      'Correo o contraseña incorrectos.',
    )
    expect(
      getErrorMessage(
        axiosError(400, { message: "'Name' must not be empty. 'Quantity' must be greater than '0'." }),
        'x',
      ),
    ).toBe("'Name' es obligatorio. 'Quantity' debe ser mayor que 0.")
    expect(
      getErrorMessage(
        axiosError(400, {
          title: 'One or more validation errors occurred.',
          errors: { '$.quantity': ['The JSON value could not be converted to System.Decimal.'] },
        }),
        'x',
      ),
    ).toBe('Hay un dato con formato inválido.')
  })

  it('leaves Spanish messages and unknown entities readable', () => {
    expect(getErrorMessage(axiosError(400, { code: 'validation', message: 'La caja está cerrada.' }), 'x')).toBe(
      'La caja está cerrada.',
    )
    expect(getErrorMessage(axiosError(404, { message: 'Gadget 9 not found.' }), 'x')).toBe('No se encontró Gadget 9.')
  })
})
