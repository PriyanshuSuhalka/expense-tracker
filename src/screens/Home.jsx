import { useMemo } from 'react'
import { useApp } from '../state/store.jsx'
import { useLive } from '../state/useLive.js'
import { expensesInMonth, recentExpenses } from '../lib/repo.js'
import { currentYM, monthLabel, money, sum } from '../lib/format.js'
import BarList from '../components/BarList.jsx'
import ExpenseRow from '../components/ExpenseRow.jsx'

export default function Home() {
  const { categories, sym } = useApp()
  const ym = currentYM()
  const rows = useLive(() => expensesInMonth(ym), [ym], [])
  const recent = useLive(() => recentExpenses(10), [], [])
  const total = sum(rows)

  const top = useMemo(() => {
    const by = new Map()
    rows.forEach((r) => by.set(r.category, (by.get(r.category) || 0) + r.amount))
    return [...by.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, t]) => { const c = categories.find((x) => x.name === name); return { name, total: t, emoji: c?.emoji || '📦', color: c?.color || '#64748b' } })
  }, [rows, categories])

  return (
    <div className="screen">
      <header className="hero">
        <p className="muted">{monthLabel(ym)}</p>
        <p className="big" data-testid="month-total">{money(total, sym)}</p>
        <p className="muted">{rows.length} {rows.length === 1 ? 'expense' : 'expenses'} this month</p>
      </header>

      {!recent.length ? (
        <div className="empty">
          <p className="empty-title">No expenses yet</p>
          <p>Tap the mic and say <em>“250 groceries at DMart”</em>, or use the + button to add one by hand.</p>
        </div>
      ) : (
        <>
          {top.length > 0 && (
            <section className="card">
              <h2>Top categories</h2>
              <BarList items={top} total={total} sym={sym} />
            </section>
          )}
          <section className="card flush">
            <h2 className="pad">Recent</h2>
            <ul className="list">{recent.map((e) => <ExpenseRow key={e.id} expense={e} swipe={false} showDate />)}</ul>
          </section>
        </>
      )}
    </div>
  )
}
