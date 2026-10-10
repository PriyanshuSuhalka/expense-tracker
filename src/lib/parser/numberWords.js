const UNITS = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9,
  ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16,
  seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50,
  sixty: 60, seventy: 70, eighty: 80, ninety: 90,
}
const SCALES = { thousand: 1e3, lakh: 1e5, lakhs: 1e5, lac: 1e5, lacs: 1e5, crore: 1e7, crores: 1e7 }

export const isNumberWord = (w) => {
  w = w.toLowerCase()
  return w in UNITS || w === 'hundred' || w in SCALES
}

const isScale = (w) => w === 'hundred' || w in SCALES

/** Find runs of number words in `text`. Returns [{ start, end, value, tokens }]. */
export function findNumberWordRuns(text) {
  const words = []
  const re = /[A-Za-z]+/g
  let m
  while ((m = re.exec(text))) words.push({ w: m[0].toLowerCase(), start: m.index, end: m.index + m[0].length })

  const runs = []
  let run = null
  const flush = () => {
    if (run && run.tokens.length) {
      const value = evalTokens(run.tokens)
      if (value > 0) runs.push({ start: run.start, end: run.end, value, tokens: run.tokens.length })
    }
    run = null
  }
  for (let i = 0; i < words.length; i++) {
    const { w, start, end } = words[i]
    const next = words[i + 1]
    const gapOk = run && /^[\s-]+$/.test(text.slice(run.end, start))
    let token = null
    if (isNumberWord(w)) token = w
    else if ((w === 'a' || w === 'an') && next && isScale(next.w) && /^\s+$/.test(text.slice(end, next.start))) token = 'one'
    else if (
      w === 'and' && run && gapOk && next && isNumberWord(next.w) &&
      isScale(run.tokens[run.tokens.length - 1]) && /^\s+$/.test(text.slice(end, next.start))
    ) {
      run.end = end
      continue
    }
    if (token === null) { flush(); continue }
    if (run && !gapOk) flush()
    if (!run) run = { start, end, tokens: [] }
    run.tokens.push(token)
    run.end = end
  }
  flush()
  return runs
}

function evalTokens(tokens) {
  let total = 0
  let cur = 0
  for (const t of tokens) {
    if (t in UNITS) cur += UNITS[t]
    else if (t === 'hundred') cur = (cur || 1) * 100
    else { total += (cur || 1) * SCALES[t]; cur = 0 }
  }
  return total + cur
}
