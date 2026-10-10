import { findNumberWordRuns } from './numberWords.js'

const UNIT = { k: 1e3, thousand: 1e3, hundred: 100, lakh: 1e5, lakhs: 1e5, lac: 1e5, lacs: 1e5, crore: 1e7, crores: 1e7, cr: 1e7 }
const BEFORE_MARK = /(?:₹|\brs\.?|\binr)\s*$/i
const AFTER_MARK = /^\s*(?:₹|rs\b\.?|rupees?|rupaye|rupay|bucks?|inr\b)/i
const MEASURE = /^\s*(?:kgs?|gms?|grams?|g|ltrs?|litres?|liters?|l|ml|pcs|pieces?|packets?|packs?|items?|people|persons?|members?|days?|hours?|hrs?|mins?|minutes?|km|kms|percent|%|x)\b/i

function attachMarks(text, start, end) {
  let marked = false
  const b = text.slice(0, start).match(BEFORE_MARK)
  if (b) { start -= b[0].length; marked = true }
  const a = text.slice(end).match(AFTER_MARK)
  if (a) { end += a[0].length; marked = true }
  return { start, end, marked }
}

/**
 * Pull the amount out of `text`.
 * Returns { value, confidence, rest } — value is null when no amount is found.
 */
export function extractAmount(text) {
  const cands = []

  const re = /(?<![\w,])(\d{1,3}(?:,\d{2,3})+|\d+)(?:\.(\d+))?/g
  let m
  while ((m = re.exec(text))) {
    const start = m.index
    let end = start + m[0].length
    let value = parseFloat(m[1].replace(/,/g, '') + (m[2] ? '.' + m[2] : ''))
    const after = text.slice(end)
    if (/^(?:st|nd|rd|th)\b/i.test(after)) continue
    const u = after.match(/^\s*(k|thousand|hundred|lakhs?|lacs?|crores?|cr)\b/i)
    if (u) {
      value *= UNIT[u[1].toLowerCase()]
      end += u[0].length
    } else if (/^[a-z]/i.test(after) && !/^(?:rs|inr)\b/i.test(after)) continue
    const measured = MEASURE.test(text.slice(end))
    const marks = attachMarks(text, start, end)
    if (value > 0) cands.push({ ...marks, value, measured, confidence: 1 })
  }

  for (const run of findNumberWordRuns(text)) {
    const marks = attachMarks(text, run.start, run.end)
    const measured = MEASURE.test(text.slice(run.end))
    const weak = run.tokens === 1 && run.value <= 10 && !marks.marked
    cands.push({ ...marks, value: run.value, measured, confidence: weak ? 0.5 : 0.9 })
  }

  if (!cands.length) return { value: null, confidence: 0, rest: text }
  let pool = cands.filter((c) => c.marked)
  if (!pool.length) pool = cands.filter((c) => !c.measured)
  if (!pool.length) pool = cands
  const best = pool.reduce((a, b) => (b.value > a.value ? b : a))
  return {
    value: Math.round(best.value * 100) / 100,
    confidence: best.confidence,
    rest: text.slice(0, best.start) + ' ' + text.slice(best.end),
  }
}
