import { useMemo, useState } from 'react'
import { useApp } from '../state/store.jsx'
import { useLive } from '../state/useLive.js'
import { expensesInMonth } from '../lib/repo.js'
import { currentYM, dayHeading, money, sum } from '../lib/format.js'
import MonthSwitcher from '../components/MonthSwitcher.jsx'
import ExpenseRow from '../components/ExpenseRow.jsx'
import { IconSheet } from '../components/Icons.jsx'

export default function Month() {
  const { categories, sym, showToast } = useApp()
  const [ym, setYm] = useState(currentYM())
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('all')
  const rows = useLive(() => expensesInMonth(ym), [ym], [])

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return rows.filter((r) => (cat === 'all' || r.category === cat) && (!needle || r.description.toLowerCase().includes(needle) || r.category.toLowerCase().includes(needle)))
  }, [rows, q, cat])

  const days = useMemo(() => {
    const m = new Map()
    filtered.forEach((r) => m.set(r.date, [...(m.get(r.date) || []), r]))
    return [...m.entries()]
  }, [filtered])

  const doExport = async () => {
    const { exportMonth } = await import('../lib/excel.js') // SheetJS is loaded only when needed
    const res = await exportMonth(ym, rows, sym)
    if (res === 'downloaded') showToast(`Downloaded Expenses_${ym}.xlsx`)
    else if (res === 'shared') showToast('Shared Excel file')
  }

  const filtering = q.trim() || cat !== 'all'

  return (
    <div className="screen">
      <MonthSwitcher ym={ym} onChange={setYm} />
      <div className="summary-line">
        <div>
          <p className="muted">{filtering ? 'Matching' : 'Total'}</p>
          <p className="big sm" data-testid="month-view-total">{money(sum(filtered), sym)}</p>
        </div>
        <button className="btn tonal" onClick={doExport} disabled={!rows.length}><IconSheet /> Export to Excel</button>
      </div>

      <div className="filters">
        <label className="sr-only" htmlFor="m-search">Search descriptions</label>
        <input id="m-search" className="input" type="search" placeholder="Search description" value={q} onChange={(e) => setQ(e.target.value)} />
        <label className="sr-only" htmlFor="m-cat">Filter by category</label>
        <select id="m-cat" className="input" value={cat} onChange={(e) => setCat(e.target.value)}>
          <option value="all">All categories</option>
          {categories.map((c) => <option key={c.id} value={c.name}>{c.emoji} {c.name}</option>)}
        </select>
      </div>

      {!days.length && <div className="empty"><p className="empty-title">{rows.length ? 'No matches' : 'Nothing this month'}</p><p>{rows.length ? 'Try a different search or category.' : 'Expenses you add will appear here.'}</p></div>}

      {days.map(([date, list]) => (
        <section key={date} className="day">
          <h3 className="day-head"><span>{dayHeading(date)}</span><span>{money(sum(list), sym)}</span></h3>
          <ul className="list card flush">{list.map((e) => <ExpenseRow key={e.id} expense={e} />)}</ul>
        </section>
      ))}
      {days.length > 0 && <p className="hint center-text">Swipe left or long-press an entry to edit or delete.</p>}
    </div>
  )
}
