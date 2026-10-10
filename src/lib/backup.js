import { db } from './db.js'
import { saveBlob } from './download.js'

export async function exportJSON() {
  const [expenses, categories, settings] = await Promise.all([db.expenses.toArray(), db.categories.toArray(), db.settings.get('main')])
  const payload = { app: 'expense-tracker', version: 1, exportedAt: new Date().toISOString(), expenses, categories, settings }
  const stamp = new Date().toISOString().slice(0, 10)
  saveBlob(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }), `expense-backup-${stamp}.json`)
  return expenses.length
}

/** Replaces all local data with the backup. Throws a readable Error for invalid files. */
export async function importJSON(text) {
  let data
  try { data = JSON.parse(text) } catch { throw new Error('That file is not valid JSON.') }
  if (data?.app !== 'expense-tracker' || !Array.isArray(data.expenses) || !Array.isArray(data.categories)) {
    throw new Error('That does not look like an Expense Tracker backup.')
  }
  const bad = data.expenses.find((e) => !e.id || typeof e.amount !== 'number' || !/^\d{4}-\d{2}-\d{2}$/.test(e.date || ''))
  if (bad) throw new Error('The backup contains an invalid expense entry.')
  await db.transaction('rw', db.expenses, db.categories, db.settings, async () => {
    await Promise.all([db.expenses.clear(), db.categories.clear()])
    await db.expenses.bulkPut(data.expenses)
    await db.categories.bulkPut(data.categories)
    if (data.settings) await db.settings.put({ ...data.settings, id: 'main' })
  })
  return data.expenses.length
}
