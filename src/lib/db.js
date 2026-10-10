import Dexie from 'dexie'
import { DEFAULT_CATEGORIES, DEFAULT_SETTINGS } from './defaults.js'

export const db = new Dexie('expense-tracker')
db.version(1).stores({
  expenses: 'id, date, category, createdAt',
  categories: 'id, order',
  settings: 'id',
})

export function uuid() {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID()
  const b = crypto.getRandomValues(new Uint8Array(16))
  b[6] = (b[6] & 0x0f) | 0x40
  b[8] = (b[8] & 0x3f) | 0x80
  const h = [...b].map((x) => x.toString(16).padStart(2, '0')).join('')
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`
}

/** Seeds categories + settings on first run and asks the browser for persistent storage. */
export async function initDb() {
  const first = !(await db.settings.get('main'))
  if (!first) return
  await db.transaction('rw', db.settings, db.categories, async () => {
    await db.settings.put({ id: 'main', ...DEFAULT_SETTINGS })
    if (!(await db.categories.count())) {
      await db.categories.bulkAdd(DEFAULT_CATEGORIES.map((c, i) => ({ id: uuid(), order: i, ...c })))
    }
  })
  try { await navigator.storage?.persist?.() } catch { /* not supported */ }
}

export async function storageStatus() {
  const out = { supported: !!navigator.storage?.persisted, persisted: false, usage: null, quota: null }
  try {
    if (out.supported) out.persisted = await navigator.storage.persisted()
    if (navigator.storage?.estimate) {
      const e = await navigator.storage.estimate()
      out.usage = e.usage ?? null
      out.quota = e.quota ?? null
    }
  } catch { /* ignore */ }
  return out
}

export async function requestPersistence() {
  try { return (await navigator.storage?.persist?.()) ?? false } catch { return false }
}
