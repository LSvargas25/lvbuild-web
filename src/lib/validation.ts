import { z } from 'zod'

// Inputs numéricos registrados con `valueAsNumber`: vacío llega como NaN.
const NUMBER_ERROR = { error: 'Ingresa un número' }

export const money = () => z.number(NUMBER_ERROR).min(0, 'No puede ser negativo')
export const positive = () => z.number(NUMBER_ERROR).positive('Debe ser mayor que 0')
export const positiveInt = () =>
  z.number(NUMBER_ERROR).int('Debe ser un número entero').positive('Debe ser mayor que 0')
export const requiredText = (message: string) => z.string().trim().min(1, message)
/** Id elegido en un select (string vacío = sin elegir). */
export const requiredId = (message: string) => z.string().min(1, message)
export const isoDate = () => z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Elige una fecha')
