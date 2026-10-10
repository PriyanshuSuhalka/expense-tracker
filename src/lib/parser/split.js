import { extractAmount } from './amount.js'
import { extractDate } from './date.js'
import { isNumberWord } from './numberWords.js'

const hasAmount = (p) => extractAmount(extractDate(p, '2026-01-01').rest).value !== null
const lastWord = (s) => (s.match(/([A-Za-z]+)\s*$/) || [])[1] || ''
const firstWord = (s) => (s.match(/^\s*([A-Za-z]+)/) || [])[1] || ''

/**
 * Split one utterance into per-expense segments ("50 for chai and 120 for auto").
 * Pieces without an amount are folded into a neighbour, and "hundred and fifty" is never split.
 */
export function splitExpenses(text) {
  const bits = text.split(/(\s*,\s+|\s*;\s*|\s+(?:and|then|also|plus)\s+)/i)
  const pieces = [bits[0]]
  for (let i = 1; i < bits.length; i += 2) {
    const delim = bits[i]
    const piece = bits[i + 1]
    const last = pieces[pieces.length - 1]
    if (/and/i.test(delim) && isNumberWord(lastWord(last)) && isNumberWord(firstWord(piece))) pieces[pieces.length - 1] = last + delim + piece
    else pieces.push(piece)
  }

  const out = []
  let pending = ''
  for (const p of pieces) {
    if (!p.trim()) continue
    if (hasAmount(p)) {
      out.push(pending ? `${pending} and ${p}` : p)
      pending = ''
    } else if (out.length) out[out.length - 1] += ` and ${p}`
    else pending = pending ? `${pending} and ${p}` : p
  }
  return out.length ? out : [text]
}
