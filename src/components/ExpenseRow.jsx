import { useRef, useState } from 'react'
import { IconEdit, IconTrash } from './Icons.jsx'
import { useApp } from '../state/store.jsx'
import { money } from '../lib/format.js'

const OPEN = 144

/** Row with swipe-left (or long-press) to reveal Edit / Delete. */
export default function ExpenseRow({ expense, swipe = true, showDate = false }) {
  const { categories, sym, openEdit, removeExpense } = useApp()
  const cat = categories.find((c) => c.name === expense.category)
  const [x, setX] = useState(0)
  const [drag, setDrag] = useState(false)
  const st = useRef({ x0: 0, y0: 0, base: 0, moved: false, long: false, timer: null, locked: false })

  const down = (e) => {
    if (!swipe) return
    const s = st.current
    s.x0 = e.clientX; s.y0 = e.clientY; s.base = x; s.moved = false; s.long = false; s.locked = false
    clearTimeout(s.timer)
    s.timer = setTimeout(() => { s.long = true; setX(-OPEN) }, 500)
  }
  const move = (e) => {
    if (!swipe) return
    const s = st.current
    const dx = e.clientX - s.x0
    const dy = e.clientY - s.y0
    if (!s.locked && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
      clearTimeout(s.timer)
      s.locked = true
      s.moved = Math.abs(dx) > Math.abs(dy)
      if (s.moved) { e.currentTarget.setPointerCapture?.(e.pointerId); setDrag(true) }
    }
    if (s.moved) setX(Math.max(-OPEN, Math.min(0, s.base + dx)))
  }
  const up = () => {
    const s = st.current
    clearTimeout(s.timer)
    setDrag(false)
    if (s.moved) setX((cur) => (cur < -OPEN / 2 ? -OPEN : 0))
    else if (!s.long && !s.locked) { if (x !== 0) setX(0); else openEdit(expense) }
  }
  const cancel = () => { clearTimeout(st.current.timer); setDrag(false) }

  return (
    <li className="row-wrap">
      {swipe && (
        <div className="row-actions">
          <button className="ra edit" aria-label="Edit expense" onClick={() => { setX(0); openEdit(expense) }}><IconEdit /><span>Edit</span></button>
          <button className="ra del" aria-label="Delete expense" onClick={() => { setX(0); removeExpense(expense) }}><IconTrash /><span>Delete</span></button>
        </div>
      )}
      <div
        className={`row ${drag ? 'dragging' : ''}`}
        style={{ transform: `translateX(${x}px)` }}
        onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={cancel}
        onContextMenu={(e) => e.preventDefault()}
        role="button" tabIndex={0}
        aria-label={`${expense.description || expense.category}, ${money(expense.amount, sym)}. Tap to edit.`}
        onKeyDown={(e) => { if (e.key === 'Enter') openEdit(expense); if (e.key === 'Delete') removeExpense(expense) }}
      >
        <span className="dot" style={{ background: cat?.color || '#64748b' }} aria-hidden="true">{cat?.emoji || '📦'}</span>
        <span className="mid">
          <span className="title">{expense.description || expense.category}</span>
          <span className="sub">
            {expense.description ? `${expense.category}` : ''}
            {expense.paymentMethod ? `${expense.description ? ' · ' : ''}${expense.paymentMethod}` : ''}
            {showDate ? `${expense.description || expense.paymentMethod ? ' · ' : ''}${expense.date.slice(8)}/${expense.date.slice(5, 7)}` : ''}
          </span>
        </span>
        <span className="amt">{money(expense.amount, sym)}</span>
      </div>
    </li>
  )
}
