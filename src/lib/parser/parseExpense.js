import { extractAmount } from './amount.js'
import { extractDate, toYMD } from './date.js'
import { extractPayment } from './payment.js'
import { matchCategory } from './category.js'
import { cleanDescription } from './description.js'
import { splitExpenses } from './split.js'

function parseOne(raw, categories, today) {
  let work = ` ${raw} `
  const d = extractDate(work, today); work = d.rest
  const p = extractPayment(work); work = p.rest
  const a = extractAmount(work); work = a.rest
  const c = matchCategory(work, categories); work = c.rest
  return {
    amount: a.value,
    category: c.category ? c.category.name : null,
    description: cleanDescription(work),
    date: d.date,
    paymentMethod: p.paymentMethod,
    confidence: { amount: a.confidence, category: c.confidence },
    raw: raw.trim(),
  }
}

/**
 * Parse a spoken/typed sentence into one or more expenses.
 * @param {string} text
 * @param {{name:string, keywords:string[]}[]} categories
 * @param {Date|string} today  Date or 'YYYY-MM-DD' (injected so tests are deterministic)
 */
export function parseExpense(text, categories = [], today = new Date()) {
  const t = String(text || '').replace(/\s+/g, ' ').trim()
  if (!t) return []
  const ymd = toYMD(today)
  return splitExpenses(t).map((seg) => parseOne(seg, categories, ymd))
}

/** Run the parser over speech alternatives; the first one where every expense has an amount wins. */
export function parseAlternatives(alternatives, categories, today) {
  const results = alternatives.map((t) => parseExpense(t, categories, today)).filter((r) => r.length)
  return results.find((r) => r.every((e) => e.amount !== null)) || results[0] || []
}
