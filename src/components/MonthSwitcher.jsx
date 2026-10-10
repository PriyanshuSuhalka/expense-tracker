import { IconLeft, IconRight } from './Icons.jsx'
import { monthLabel, shiftMonth, currentYM } from '../lib/format.js'

export default function MonthSwitcher({ ym, onChange }) {
  return (
    <div className="month-switch">
      <button className="icon-btn" aria-label="Previous month" onClick={() => onChange(shiftMonth(ym, -1))}><IconLeft /></button>
      <button className="month-label" onClick={() => onChange(currentYM())} aria-label={`${monthLabel(ym)}. Jump to current month`}>{monthLabel(ym)}</button>
      <button className="icon-btn" aria-label="Next month" onClick={() => onChange(shiftMonth(ym, 1))}><IconRight /></button>
    </div>
  )
}
