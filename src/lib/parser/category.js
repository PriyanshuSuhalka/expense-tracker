const words = (s) => s.toLowerCase().replace(/&/g, ' and ').match(/[a-z0-9]+/g) || []

export function stem(w) {
  if (w.endsWith('ies') && w.length > 4) return w.slice(0, -3) + 'y'
  if (/(?:ss|us|is)$/.test(w)) return w
  if (/(?:ses|xes|zes|ches|shes)$/.test(w)) return w.slice(0, -2)
  if (w.endsWith('s') && w.length > 3) return w.slice(0, -1)
  return w
}
const same = (a, b) => a === b || stem(a) === stem(b) || stem(a) === b || a === stem(b)

function find(tokens, phrase) {
  if (!phrase.length) return -1
  outer: for (let i = 0; i + phrase.length <= tokens.length; i++) {
    for (let j = 0; j < phrase.length; j++) if (!same(tokens[i + j], phrase[j])) continue outer
    return i
  }
  return -1
}

const EXPLICIT = [
  /\b(?:in|under|into)\s+(?:the\s+)?([a-z&' ]+?)\s+category\b/i,
  /\bcategory\s*(?:is|as|:)?\s+([a-z&]+(?:\s+(?:and|&)\s+[a-z]+)?)/i,
  /\bunder\s+(?:the\s+)?([a-z&]+(?:\s+(?:and|&)\s+[a-z]+)?)/i,
]

function resolveName(phrase, categories) {
  const toks = words(phrase)
  let best = null
  let bestScore = 0
  let tie = false
  for (const c of categories) {
    const nameToks = words(c.name)
    let score = 0
    if (nameToks.length === toks.length && toks.every((t, i) => same(t, nameToks[i]))) score = 4
    else if ((c.keywords || []).some((k) => { const kt = words(k); return kt.length === toks.length && toks.every((t, i) => same(t, kt[i])) })) score = 3
    else if (toks.length === 1 && same(toks[0], nameToks[0])) score = 2
    else if (toks.length === 1 && nameToks.some((n) => n !== 'and' && same(toks[0], n))) score = 1
    if (score > bestScore) { best = c; bestScore = score; tie = false }
    else if (score && score === bestScore) tie = true
  }
  return tie ? null : best
}

function explicit(text, categories) {
  for (const re of EXPLICIT) {
    const m = re.exec(text)
    if (!m) continue
    const ws = m[1].trim().split(/\s+/)
    for (const phrase of [m[1], ws[0], ws[ws.length - 1]]) {
      const cat = resolveName(phrase, categories)
      if (!cat) continue
      let end = m.index + m[0].length
      if (phrase !== m[1] && phrase === ws[0] && ws.length > 1) {
        // matched only the first word of the phrase: cut the span short so the rest stays in the description
        const at = text.toLowerCase().indexOf(phrase.toLowerCase(), m.index + m[0].indexOf(m[1]))
        end = at + phrase.length
      }
      return { category: cat, rest: text.slice(0, m.index) + ' ' + text.slice(end) }
    }
  }
  return null
}

/**
 * Returns { category: Category|null, confidence, rest }.
 * Explicit phrasing ("under X", "category X") wins; otherwise the unique best keyword match.
 * Ties between categories yield null so the app asks.
 */
export function matchCategory(text, categories) {
  const ex = explicit(text, categories)
  if (ex) return { category: ex.category, confidence: 1, rest: ex.rest }

  const tokens = words(text)
  let top = 0
  let winners = []
  for (const c of categories) {
    if (c.name.toLowerCase() === 'other') continue
    const terms = new Set([words(c.name).join(' '), ...(c.keywords || []).map((k) => words(k).join(' '))])
    let hits = 0
    for (const t of terms) if (t && find(tokens, t.split(' ')) >= 0) hits++
    if (hits > top) { top = hits; winners = [c] }
    else if (hits && hits === top) winners.push(c)
  }
  if (winners.length !== 1) return { category: null, confidence: 0, rest: text }
  return { category: winners[0], confidence: top >= 2 ? 0.95 : 0.9, rest: text }
}
