const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december']
const MONTH_RE = '(january|jan|february|feb|march|mar|april|apr|may|june|jun|july|jul|august|aug|september|sept|sep|october|oct|november|nov|december|dec)'
const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
const SMALL = { a: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7 }

export const pad = (n) => String(n).padStart(2, '0')
export const fmtYMD = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`

/** Accepts a Date or 'YYYY-MM-DD'; returns 'YYYY-MM-DD' (local time for Dates). */
export function toYMD(v) {
  if (typeof v === 'string') return v.slice(0, 10)
  return fmtYMD(v.getFullYear(), v.getMonth() + 1, v.getDate())
}
const parts = (ymd) => ymd.split('-').map(Number)
const utc = (ymd) => { const [y, m, d] = parts(ymd); return new Date(Date.UTC(y, m - 1, d)) }
const fromUtc = (dt) => fmtYMD(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate())
export function addDays(ymd, n) {
  const dt = utc(ymd)
  dt.setUTCDate(dt.getUTCDate() + n)
  return fromUtc(dt)
}
const validDay = (y, m, d) => { const dt = new Date(Date.UTC(y, m - 1, d)); return dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d }
const monthIndex = (name) => MONTHS.findIndex((m) => m.startsWith(name.toLowerCase().slice(0, 3))) + 1

function monthDay(day, month, year, today) {
  const [ty] = parts(today)
  if (year) return validDay(year, month, day) ? fmtYMD(year, month, day) : null
  if (!validDay(ty, month, day)) return null
  const here = fmtYMD(ty, month, day)
  if (here <= today) return here
  return validDay(ty - 1, month, day) ? fmtYMD(ty - 1, month, day) : null
}

// "on the 5th": this month if already past, otherwise walk back to the previous valid month.
function dayOnly(day, today) {
  let [y, m] = parts(today)
  for (let i = 0; i < 13; i++) {
    if (validDay(y, m, day)) {
      const c = fmtYMD(y, m, day)
      if (c <= today) return c
    }
    m -= 1
    if (m === 0) { m = 12; y -= 1 }
  }
  return null
}

const RULES = [
  [/\b(?:on\s+)?day\s+before\s+yesterday\b/i, (_m, t) => addDays(t, -2)],
  [/\b(?:on\s+)?yesterday\b/i, (_m, t) => addDays(t, -1)],
  [/\b(?:on\s+)?(?:today|tonight)\b/i, (_m, t) => t],
  [/\b(\d+|a|one|two|three|four|five|six|seven)\s+days?\s+ago\b/i, (m, t) => addDays(t, -(SMALL[m[1].toLowerCase()] ?? Number(m[1])))],
  [new RegExp(`\\b(?:on\\s+)?(?:the\\s+)?(\\d{1,2})(?:st|nd|rd|th)?\\s+(?:of\\s+)?${MONTH_RE}\\b(?:\\s*,?\\s*(\\d{4}))?`, 'i'),
    (m, t) => monthDay(Number(m[1]), monthIndex(m[2]), m[3] ? Number(m[3]) : null, t)],
  [new RegExp(`\\b(?:on\\s+)?${MONTH_RE}\\s+(\\d{1,2})(?:st|nd|rd|th)?(?!\\d)(?:\\s*,?\\s*(\\d{4}))?`, 'i'),
    (m, t) => monthDay(Number(m[2]), monthIndex(m[1]), m[3] ? Number(m[3]) : null, t)],
  [/\b(?:on\s+)?(?:the\s+)?(\d{1,2})(?:st|nd|rd|th)\b/i, (m, t) => dayOnly(Number(m[1]), t)],
  // A weekday always means the most recent *past* occurrence (never today).
  [new RegExp(`\\b(?:(?:on|last|this|previous|coming)\\s+)*(${WEEKDAYS.join('|')})\\b`, 'i'), (m, t) => {
    const diff = ((utc(t).getUTCDay() - WEEKDAYS.indexOf(m[1].toLowerCase()) + 6) % 7) + 1
    return addDays(t, -diff)
  }],
]

/** Returns { date, found, rest }. `date` defaults to today. */
export function extractDate(text, today) {
  for (const [re, resolve] of RULES) {
    const m = re.exec(text)
    if (!m) continue
    const date = resolve(m, today)
    if (!date) continue
    return { date, found: true, rest: text.slice(0, m.index) + ' ' + text.slice(m.index + m[0].length) }
  }
  return { date: today, found: false, rest: text }
}
