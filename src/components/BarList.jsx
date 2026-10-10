import { money } from '../lib/format.js'

/** Horizontal bars in plain CSS — no chart library. items: [{ name, emoji, color, total }] */
export default function BarList({ items, total, sym }) {
  const max = Math.max(...items.map((i) => i.total), 1)
  return (
    <ul className="bars" aria-label="Spending by category">
      {items.map((i) => (
        <li key={i.name}>
          <div className="bar-head">
            <span>{i.emoji} {i.name}</span>
            <span className="bar-val">{money(i.total, sym)} <small>{total ? Math.round((i.total / total) * 100) : 0}%</small></span>
          </div>
          <div className="bar-track" role="presentation"><div className="bar-fill" style={{ width: `${(i.total / max) * 100}%`, background: i.color }} /></div>
        </li>
      ))}
    </ul>
  )
}
