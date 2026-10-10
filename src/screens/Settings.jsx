import { useEffect, useRef, useState } from 'react'
import { useApp } from '../state/store.jsx'
import { saveSettings, allExpenses } from '../lib/repo.js'
import { storageStatus, requestPersistence } from '../lib/db.js'
import { exportJSON, importJSON } from '../lib/backup.js'
import { formatBytes } from '../lib/format.js'

const CURRENCIES = [['₹', 'INR'], ['$', 'USD'], ['€', 'EUR'], ['£', 'GBP'], ['AED', 'AED'], ['S$', 'SGD']]
const LANGS = [['en-IN', 'English (India)'], ['hi-IN', 'Hindi (India)'], ['en-US', 'English (US)'], ['en-GB', 'English (UK)'], ['en-AU', 'English (Australia)']]

function Toggle({ id, label, hint, checked, onChange }) {
  return (
    <div className="setting">
      <div className="mid"><label htmlFor={id} className="title">{label}</label>{hint && <p className="sub">{hint}</p>}</div>
      <input id={id} type="checkbox" role="switch" className="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </div>
  )
}

export default function Settings() {
  const { settings, showToast, ask } = useApp()
  const [storage, setStorage] = useState(null)
  const file = useRef(null)
  const refresh = () => storageStatus().then(setStorage)
  useEffect(() => { refresh() }, [])

  const set = (patch) => saveSettings(patch)

  const backup = async () => showToast(`Exported ${await exportJSON()} expenses`)
  const restore = async (ev) => {
    const f = ev.target.files?.[0]
    ev.target.value = ''
    if (!f) return
    const ok = await ask({ title: 'Restore from backup?', message: 'This replaces ALL expenses and categories on this device with the contents of the file.', confirmLabel: 'Replace data', danger: true })
    if (!ok) return
    try { showToast(`Restored ${await importJSON(await f.text())} expenses`) } catch (e) { showToast(e.message) }
  }
  const excelAll = async () => {
    const rows = await allExpenses()
    if (!rows.length) return showToast('No expenses to export yet')
    const { exportAll } = await import('../lib/excel.js')
    const r = await exportAll(rows, settings.currencySymbol)
    if (r === 'downloaded') showToast('Downloaded Expenses_all.xlsx')
  }
  const persist = async () => { const ok = await requestPersistence(); await refresh(); showToast(ok ? 'Storage is now persistent' : 'Browser declined persistent storage') }

  return (
    <div className="screen">
      <div className="screen-head"><h1>Settings</h1></div>

      <section className="card">
        <h2>General</h2>
        <div className="field">
          <label htmlFor="s-cur">Currency</label>
          <select id="s-cur" className="input" value={settings.currencyCode} onChange={(e) => { const c = CURRENCIES.find((x) => x[1] === e.target.value); set({ currencyCode: c[1], currencySymbol: c[0] }) }}>
            {CURRENCIES.map(([s, c]) => <option key={c} value={c}>{s} {c}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="s-lang">Speech language</label>
          <select id="s-lang" className="input" value={settings.speechLang} onChange={(e) => set({ speechLang: e.target.value })}>
            {LANGS.map(([c, n]) => <option key={c} value={c}>{n}</option>)}
          </select>
        </div>
        <Toggle id="s-tts" label="Speak questions aloud" hint="Says “Which category?” when one is missing." checked={settings.ttsEnabled} onChange={(v) => set({ ttsEnabled: v })} />
        <Toggle id="s-auto" label="Auto-save when confident" hint="Auto-save when amount and category are confidently detected." checked={settings.autoSave} onChange={(v) => set({ autoSave: v })} />
      </section>

      <section className="card">
        <h2>Export</h2>
        <p className="hint">Monthly exports are on the Month screen. This creates one workbook with a sheet per month.</p>
        <button className="btn tonal wide" onClick={excelAll}>Export everything to Excel</button>
      </section>

      <section className="card">
        <h2>Backup</h2>
        <p className="warn">⚠️ Your data lives only on this phone. Clearing Chrome’s site data (or uninstalling the app) deletes everything — back up regularly.</p>
        <div className="stack">
          <button className="btn tonal wide" onClick={backup}>Export backup (JSON)</button>
          <button className="btn tonal wide" onClick={() => file.current.click()}>Restore from backup…</button>
          <input ref={file} type="file" accept="application/json,.json" hidden onChange={restore} aria-label="Backup file" />
        </div>
      </section>

      <section className="card">
        <h2>Storage</h2>
        {storage && (
          <dl className="kv">
            <dt>Persistent storage</dt>
            <dd data-testid="persist-status">{!storage.supported ? 'Not supported' : storage.persisted ? '✅ Granted' : '⚠️ Not granted'}</dd>
            <dt>Used</dt><dd>{formatBytes(storage.usage)}</dd>
          </dl>
        )}
        {storage?.supported && !storage.persisted && (
          <>
            <p className="hint">Without persistence the browser may evict data when the phone is low on space. Installing the app to the home screen usually lets Chrome grant it.</p>
            <button className="btn tonal wide" onClick={persist}>Request persistence</button>
          </>
        )}
      </section>

      <p className="hint center-text">Expense Tracker · all data stays on this device.<br />Speech audio is processed by your browser’s speech service.</p>
    </div>
  )
}
