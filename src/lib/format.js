import { toYMD, pad } from './parser/date.js'

export const todayYMD = () => toYMD(new Date())
export const currentYM = () => todayYMD().slice(0, 7)

export function shiftMonth(ym, delta) {
  const [y, m] = ym.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`
}

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DAY = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
export const monthLabel = (ym) => `${MON[Number(ym.slice(5)) - 1]} ${ym.slice(0, 4)}`
export const weekdayName = (ymd) => { const [y, m, d] = ymd.split('-').map(Number); return DAY[new Date(y, m - 1, d).getDay()] }
export const shortDate = (ymd) => `${Number(ymd.slice(8))} ${MON[Number(ymd.slice(5, 7)) - 1]}`

export function dayHeading(ymd) {
  const t = todayYMD()
  const y = toYMD(new Date(Date.now() - 864e5))
  const base = `${weekdayName(ymd).slice(0, 3)}, ${shortDate(ymd)}`
  return ymd === t ? `Today · ${base}` : ymd === y ? `Yesterday · ${base}` : base
}

export function money(n, symbol = '₹') {
  const v = Number(n) || 0
  const frac = Math.abs(v % 1) > 0
  return `${symbol}${v.toLocaleString('en-IN', { minimumFractionDigits: frac ? 2 : 0, maximumFractionDigits: 2 })}`
}

export const sum = (rows) => rows.reduce((s, r) => s + r.amount, 0)

export function formatBytes(n) {
  if (n == null) return '—'
  if (n < 1024) return `${n} B`
  if (n < 1048576) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / 1048576).toFixed(1)} MB`
}
