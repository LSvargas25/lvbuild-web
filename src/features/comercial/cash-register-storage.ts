const STORAGE_KEY = 'lv_open_cash_register_id'

export function getOpenRegisterId(): number | null {
  const raw = localStorage.getItem(STORAGE_KEY)
  return raw ? Number(raw) : null
}

export function setOpenRegisterId(id: number): void {
  localStorage.setItem(STORAGE_KEY, String(id))
}

export function clearOpenRegisterId(): void {
  localStorage.removeItem(STORAGE_KEY)
}
