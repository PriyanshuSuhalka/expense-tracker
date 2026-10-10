import { useState } from 'react'
import { useApp } from '../state/store.jsx'
import { addCategory, updateCategory, deleteCategory, reorderCategories } from '../lib/repo.js'
import Sheet from '../components/Sheet.jsx'
import { IconUp, IconDown, IconPlus } from '../components/Icons.jsx'

function Editor({ cat, onClose }) {
  const { ask, showToast, categories } = useApp()
  const isNew = !cat
  const [name, setName] = useState(cat?.name || '')
  const [emoji, setEmoji] = useState(cat?.emoji || '🏷️')
  const [color, setColor] = useState(cat?.color || '#64748b')
  const [kw, setKw] = useState((cat?.keywords || []).join(', '))
  const [err, setErr] = useState('')
  const locked = cat?.name === 'Other'

  const save = async () => {
    const n = name.trim()
    if (!n) return setErr('Give the category a name.')
    if (categories.some((c) => c.id !== cat?.id && c.name.toLowerCase() === n.toLowerCase())) return setErr('A category with that name already exists.')
    const keywords = [...new Set(kw.split(',').map((k) => k.trim().toLowerCase()).filter(Boolean))]
    if (isNew) await addCategory({ name: n, emoji, color, keywords })
    else await updateCategory(cat.id, { name: locked ? cat.name : n, emoji, color, keywords })
    onClose()
  }
  const remove = async () => {
    const ok = await ask({ title: `Delete “${cat.name}”?`, message: 'Its expenses will be moved to “Other”.', confirmLabel: 'Delete', danger: true })
    if (!ok) return
    await deleteCategory(cat.id)
    showToast(`Deleted ${cat.name}`)
    onClose()
  }

  return (
    <Sheet title={isNew ? 'New category' : 'Edit category'} onClose={onClose}>
      <div className="confirm">
        <div className="field"><label htmlFor="ce-name">Name</label><input id="ce-name" className="input" value={name} onChange={(e) => setName(e.target.value)} disabled={locked} autoFocus={isNew} /></div>
        <div className="two">
          <div className="field"><label htmlFor="ce-emoji">Emoji</label><input id="ce-emoji" className="input" value={emoji} onChange={(e) => setEmoji(e.target.value)} maxLength={8} /></div>
          <div className="field"><label htmlFor="ce-color">Color</label><input id="ce-color" className="input color" type="color" value={color} onChange={(e) => setColor(e.target.value)} /></div>
        </div>
        <div className="field">
          <label htmlFor="ce-kw">Keywords (comma separated)</label>
          <textarea id="ce-kw" className="input" rows={3} value={kw} onChange={(e) => setKw(e.target.value)} placeholder="swiggy, zomato, chai" />
          <p className="hint">Words you say that should map to this category.</p>
        </div>
        {err && <p className="error-text" role="alert">{err}</p>}
        <div className="actions">
          {!isNew && !locked && <button className="btn danger-ghost" onClick={remove}>Delete</button>}
          <button className="btn primary" onClick={save}>Save</button>
        </div>
      </div>
    </Sheet>
  )
}

export default function Categories() {
  const { categories } = useApp()
  const [editing, setEditing] = useState(undefined) // undefined = closed, null = new, object = edit

  const move = async (i, d) => {
    const ids = categories.map((c) => c.id)
    const j = i + d
    if (j < 0 || j >= ids.length) return
    ;[ids[i], ids[j]] = [ids[j], ids[i]]
    await reorderCategories(ids)
  }

  return (
    <div className="screen">
      <div className="screen-head">
        <h1>Categories</h1>
        <button className="btn tonal" onClick={() => setEditing(null)}><IconPlus /> Add</button>
      </div>
      <ul className="list card flush">
        {categories.map((c, i) => (
          <li key={c.id} className="cat-row">
            <button className="cat-main" onClick={() => setEditing(c)} aria-label={`Edit ${c.name}`}>
              <span className="dot" style={{ background: c.color }} aria-hidden="true">{c.emoji}</span>
              <span className="mid"><span className="title">{c.name}</span><span className="sub">{c.keywords.length ? c.keywords.join(', ') : 'No keywords'}</span></span>
            </button>
            <div className="reorder">
              <button className="icon-btn" aria-label={`Move ${c.name} up`} disabled={i === 0} onClick={() => move(i, -1)}><IconUp /></button>
              <button className="icon-btn" aria-label={`Move ${c.name} down`} disabled={i === categories.length - 1} onClick={() => move(i, 1)}><IconDown /></button>
            </div>
          </li>
        ))}
      </ul>
      {editing !== undefined && <Editor cat={editing} onClose={() => setEditing(undefined)} />}
    </div>
  )
}
