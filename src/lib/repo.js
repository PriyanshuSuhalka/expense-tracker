import { db, uuid } from './db.js'
import { DEFAULT_SETTINGS } from './defaults.js'

// ---------- settings ----------
export async function getSettings() {
  return { ...DEFAULT_SETTINGS, ...((await db.settings.get('main')) || {}) }
}
export async function saveSettings(patch) {
  const cur = await getSettings()
  await db.settings.put({ ...cur, ...patch, id: 'main' })
}

// ---------- categories ----------
export const listCategories = () => db.categories.orderBy('order').toArray()

export async function addCategory({ name, emoji = '🏷️', color = '#64748b', keywords = [] }) {
  const last = await db.categories.orderBy('order').last()
  const cat = { id: uuid(), name: name.trim(), emoji, color, keywords, order: (last?.order ?? -1) + 1 }
  await db.categories.add(cat)
  return cat
}

export async function updateCategory(id, patch) {
  await db.transaction('rw', db.categories, db.expenses, async () => {
    const old = await db.categories.get(id)
    if (!old) return
    await db.categories.update(id, patch)
    if (patch.name && patch.name !== old.name) await db.expenses.where('category').equals(old.name).modify({ category: patch.name })
  })
}

export async function addKeyword(id, word) {
  const w = word.trim().toLowerCase()
  if (!w) return
  const c = await db.categories.get(id)
  if (c && !c.keywords.includes(w)) await db.categories.update(id, { keywords: [...c.keywords, w] })
}

/** Deletes a category, moving its expenses to "Other". "Other" itself cannot be deleted. */
export async function deleteCategory(id) {
  return db.transaction('rw', db.categories, db.expenses, async () => {
    const cat = await db.categories.get(id)
    if (!cat || cat.name === 'Other') return false
    let other = (await db.categories.toArray()).find((c) => c.name === 'Other')
    if (!other) {
      other = { id: uuid(), name: 'Other', emoji: '📦', color: '#64748b', keywords: [], order: 9999 }
      await db.categories.add(other)
    }
    await db.expenses.where('category').equals(cat.name).modify({ category: 'Other', updatedAt: Date.now() })
    await db.categories.delete(id)
    return true
  })
}

export async function reorderCategories(ids) {
  await db.transaction('rw', db.categories, async () => {
    for (let i = 0; i < ids.length; i++) await db.categories.update(ids[i], { order: i })
  })
}

// ---------- expenses ----------
export async function addExpense(e, currency = 'INR') {
  const now = Date.now()
  const row = {
    id: uuid(),
    amount: Number(e.amount),
    currency: e.currency || currency,
    category: e.category,
    description: (e.description || '').trim(),
    paymentMethod: e.paymentMethod || null,
    date: e.date,
    createdAt: now,
    updatedAt: now,
    source: e.source || 'manual',
    rawTranscript: e.rawTranscript ?? null,
  }
  await db.expenses.add(row)
  return row
}

export async function updateExpense(id, patch) {
  await db.expenses.update(id, {
    amount: Number(patch.amount),
    category: patch.category,
    description: (patch.description || '').trim(),
    paymentMethod: patch.paymentMethod || null,
    date: patch.date,
    updatedAt: Date.now(),
  })
}

export const deleteExpense = (id) => db.expenses.delete(id)
export const deleteExpenses = (ids) => db.expenses.bulkDelete(ids)
export const restoreExpense = (row) => db.expenses.put(row)

const byNewest = (a, b) => (a.date === b.date ? b.createdAt - a.createdAt : a.date < b.date ? 1 : -1)

export async function expensesInMonth(ym) {
  const rows = await db.expenses.where('date').between(`${ym}-01`, `${ym}-32`, true, false).toArray()
  return rows.sort(byNewest)
}

export async function recentExpenses(n = 10) {
  return (await db.expenses.toArray()).sort(byNewest).slice(0, n)
}

export const allExpenses = async () => (await db.expenses.toArray()).sort(byNewest)
