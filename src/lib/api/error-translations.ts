/**
 * La API responde en español, pero algunos mensajes pueden llegar en inglés (versiones
 * anteriores del backend, validaciones por defecto de FluentValidation o del model binding de
 * ASP.NET Core). Aquí se traducen los conocidos; lo demás pasa tal cual.
 */

const ENTITY_LABELS: Record<string, string> = {
  Budget: 'el presupuesto',
  Offer: 'la oferta',
  Branch: 'la sucursal',
  SiteLog: 'la bitácora',
  Invoice: 'la factura',
  User: 'el usuario',
  Project: 'el proyecto',
  Product: 'el producto',
  MaterialTicket: 'el tiquete de material',
  Payroll: 'la planilla',
  Incident: 'el imprevisto',
  Worker: 'el trabajador',
  Supplier: 'el proveedor',
  ProductIncorporationTicket: 'el tiquete de ingreso de producto',
  InventoryMovement: 'el movimiento de inventario',
  Customer: 'el cliente',
  CashRegister: 'la caja',
  Notification: 'la notificación',
  Material: 'el material',
}

const EXACT: Record<string, string> = {
  'Invalid email or password.': 'Correo o contraseña incorrectos.',
  'This account is blocked. Contact an administrator.':
    'Esta cuenta está bloqueada. Contacte a un administrador.',
  'Invalid or expired refresh token.': 'La sesión no es válida o expiró. Inicie sesión de nuevo.',
  'Invalid or expired password reset token.':
    'El enlace para restablecer la contraseña no es válido o expiró.',
  'Email is already registered.': 'El correo ya está registrado.',
  'User not found.': 'No se encontró el usuario.',
  'An unexpected error occurred.': 'Ocurrió un error inesperado. Intente de nuevo más tarde.',
  'One or more validation errors occurred.': 'La solicitud tiene datos inválidos.',
}

type Rule = [RegExp, (...groups: string[]) => string]

// FluentValidation (mensajes por defecto en inglés) y model binding de ASP.NET Core.
const PATTERNS: Rule[] = [
  [/^(\w+) (\S+) not found\.?$/, (entity, id) =>
    ENTITY_LABELS[entity] ? `No se encontró ${ENTITY_LABELS[entity]} ${id}.` : `No se encontró ${entity} ${id}.`],
  [/^'(.+)' must not be empty\.$/, (field) => `'${field}' es obligatorio.`],
  [/^'(.+)' must not be null\.$/, (field) => `'${field}' es obligatorio.`],
  [/^'(.+)' is not a valid email address\.$/, (field) => `'${field}' no es un correo válido.`],
  [/^'(.+)' must be greater than or equal to '(.+)'\.$/, (field, n) => `'${field}' debe ser mayor o igual a ${n}.`],
  [/^'(.+)' must be greater than '(.+)'\.$/, (field, n) => `'${field}' debe ser mayor que ${n}.`],
  [/^'(.+)' must be less than or equal to '(.+)'\.$/, (field, n) => `'${field}' debe ser menor o igual a ${n}.`],
  [/^'(.+)' must be less than '(.+)'\.$/, (field, n) => `'${field}' debe ser menor que ${n}.`],
  [/^'(.+)' has a range of values which does not include '(.+)'\.$/, (field, v) =>
    `'${field}' no admite el valor '${v}'.`],
  [/^The length of '(.+)' must be (\d+) characters or fewer\..*$/, (field, n) =>
    `'${field}' admite como máximo ${n} caracteres.`],
  [/^The (.+) field is required\.$/, (field) => `El campo ${field} es obligatorio.`],
  [/^The JSON value could not be converted to .*$/, () => 'Hay un dato con formato inválido.'],
]

/**
 * Traduce un mensaje de la API si es uno de los conocidos en inglés. Los validadores unen varios
 * errores con espacios ("'Name' must not be empty. 'Email' is not..."), así que se traduce cada
 * frase por separado.
 */
export function translateApiMessage(message: string): string {
  return message
    .trim()
    .split(/(?<=\.)\s+(?=')/)
    .map(translateSentence)
    .join(' ')
}

function translateSentence(trimmed: string): string {
  const exact = EXACT[trimmed]
  if (exact) return exact
  for (const [pattern, translate] of PATTERNS) {
    const match = pattern.exec(trimmed)
    if (match) return translate(...match.slice(1))
  }
  return trimmed
}
