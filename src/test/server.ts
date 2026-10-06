import { setupServer } from 'msw/node'

/** Base URL the tests run against (VITE_API_BASE_URL is not set under Vitest). */
export const API = 'http://api.test/api'

export const server = setupServer()
