import * as XLSX from 'xlsx'
import { weekdayName, sum } from './format.js'
import { shareOrDownload } from './download.js'

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

// Excel stores dates as day serials (1900 system); computing it from UTC avoids timezone drift.
const serial = (ymd) => {
  const [y, m, d] = ymd.split('-').map(Number)
  return Date.UTC(y, m - 1, d) / 86400000 + 25569
}

const moneyFmt = (symbol) => `"${symbol}"#,##0.00`

function transactionsSheet(rows, symbol) {
  const sorted = [...rows].sort((a, b) => (a.date === b.date ? a.createdAt - b.createdAt : a.date < b.date ? -1 : 1))
  const header = ['Date', 'Day', 'Category', 'Description', 'Payment Method', 'Amount', 'Source', 'Raw Transcript']
  const aoa = [header]
  sorted.forEach((e) => {
    aoa.push([
      { t: 'n', v: serial(e.date), z: 'dd-mmm-yyyy' },
      weekdayName(e.date),
      e.category,
      e.description,
      e.paymentMethod || '',
      { t: 'n', v: e.amount, z: moneyFmt(symbol) },
      e.source,
      e.rawTranscript || '',
    ])
  })
  const first = 2
  const last = sorted.length + 1
  aoa.push(['Total', '', '', '', '', { t: 'n', v: sum(sorted), f: sorted.length ? `SUM(F${first}:F${last})` : undefined, z: moneyFmt(symbol) }, '', ''])
  const ws = XLSX.utils.aoa_to_sheet(aoa)
  ws['!cols'] = [{ wch: 13 }, { wch: 11 }, { wch: 20 }, { wch: 34 }, { wch: 16 }, { wch: 14 }, { wch: 9 }, { wch: 40 }]
  return ws
}

function summarySheet(rows, symbol) {
  const by = new Map()
  rows.forEach((e) => {
    const s = by.get(e.category) || { count: 0, total: 0 }
    s.count += 1
    s.total += e.amount
    by.set(e.category, s)
  })
  const total = sum(rows)
  const lines = [...by.entries()].sort((a, b) => b[1].total - a[1].total)
  const aoa = [['Category', 'Count', 'Total', '% of Month']]
  lines.forEach(([cat, s]) => aoa.push([cat, s.count, { t: 'n', v: s.total, z: moneyFmt(symbol) }, { t: 'n', v: total ? s.total / total : 0, z: '0.0%' }]))
  aoa.push(['Grand Total', rows.length, { t: 'n', v: total, z: moneyFmt(symbol) }, { t: 'n', v: total ? 1 : 0, z: '0.0%' }])
  const ws = XLSX.utils.aoa_to_sheet(aoa)
  ws['!cols'] = [{ wch: 22 }, { wch: 8 }, { wch: 15 }, { wch: 12 }]
  return ws
}

export function buildMonthWorkbook(rows, symbol = '₹') {
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, transactionsSheet(rows, symbol), 'Transactions')
  XLSX.utils.book_append_sheet(wb, summarySheet(rows, symbol), 'Summary')
  return wb
}

/** One sheet per month ("2026-10"), same columns as the Transactions sheet. */
export function buildAllWorkbook(rows, symbol = '₹') {
  const wb = XLSX.utils.book_new()
  const months = [...new Set(rows.map((r) => r.date.slice(0, 7)))].sort()
  months.forEach((ym) => XLSX.utils.book_append_sheet(wb, transactionsSheet(rows.filter((r) => r.date.startsWith(ym)), symbol), ym))
  return wb
}

const toBlob = (wb) => new Blob([XLSX.write(wb, { type: 'array', bookType: 'xlsx', cellStyles: true })], { type: XLSX_MIME })

export const exportMonth = (ym, rows, symbol) => shareOrDownload(toBlob(buildMonthWorkbook(rows, symbol)), `Expenses_${ym}.xlsx`, `Expenses ${ym}`)
export const exportAll = (rows, symbol) => shareOrDownload(toBlob(buildAllWorkbook(rows, symbol)), 'Expenses_all.xlsx', 'All expenses')
