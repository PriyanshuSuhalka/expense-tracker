import { useEffect, useRef, useState } from 'react'
import Sheet from './Sheet.jsx'
import { IconMic } from './Icons.jsx'
import { useApp } from '../state/store.jsx'
import { PAYMENT_METHODS } from '../lib/defaults.js'
import { listen, speechSupported } from '../lib/speech.js'
import { matchCategory } from '../lib/parser/category.js'
import { extractAmount } from '../lib/parser/amount.js'
import { speak } from '../lib/tts.js'

/** Mini voice answer for a single missing field ("Which category?" / "How much?"). */
function useFieldVoice(lang, onAnswer) {
  const [state, setState] = useState({ on: false, text: '', msg: '' })
  const session = useRef(null)
  useEffect(() => () => session.current?.abort(), [])
  const start = (kind) => {
    session.current?.abort()
    setState({ on: true, text: '', msg: '' })
    session.current = listen(lang, {
      onInterim: (t) => setState((s) => ({ ...s, text: t })),
      onFinal: (alts) => {
        const ok = onAnswer(kind, alts)
        setState({ on: false, text: '', msg: ok ? '' : 'Didn’t catch that — tap an option instead.' })
      },
      onError: () => setState({ on: false, text: '', msg: 'Didn’t catch that — tap an option instead.' }),
    })
  }
  return { ...state, start }
}

export default function ConfirmSheet() {
  const { flow, saveDraft, discardDraft, categories, settings, sym } = useApp()
  const base = flow.drafts[flow.index]
  const [amountStr, setAmountStr] = useState(base.amount == null ? '' : String(base.amount))
  const [category, setCategory] = useState(base.category)
  const [description, setDescription] = useState(base.description)
  const [date, setDate] = useState(base.date)
  const [payment, setPayment] = useState(base.paymentMethod)
  const [learn, setLearn] = useState(true)
  const [busy, setBusy] = useState(false)

  const amount = Number(amountStr.replace(/,/g, ''))
  const amountOk = amountStr.trim() !== '' && Number.isFinite(amount) && amount > 0
  const needAmount = !amountOk
  const needCategory = !category
  const askCategory = needCategory && !base.manual
  const canSave = amountOk && !!category && /^\d{4}-\d{2}-\d{2}$/.test(date) && !busy

  const learnWord = description.trim().toLowerCase()
  const canLearn = flow.mode === 'new' && !base.parsedCategory && !!category && learnWord && learnWord.split(/\s+/).length <= 3

  const voice = useFieldVoice(settings.speechLang, (kind, alts) => {
    if (kind === 'category') {
      for (const a of alts) {
        const m = matchCategory(a, categories.filter((c) => c.name !== 'Other'))
        if (m.category) { setCategory(m.category.name); return true }
        const other = /\bother\b/i.test(a) && categories.find((c) => c.name === 'Other')
        if (other) { setCategory(other.name); return true }
      }
      return false
    }
    for (const a of alts) {
      const r = extractAmount(` ${a} `)
      if (r.value != null) { setAmountStr(String(r.value)); return true }
    }
    return false
  })

  useEffect(() => {
    if (!settings.ttsEnabled || base.manual) return
    if (base.amount == null) speak('How much?', settings.speechLang)
    else if (!base.category) speak('Which category?', settings.speechLang)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const save = async () => {
    setBusy(true)
    await saveDraft({ ...base, amount, category, description, date, paymentMethod: payment }, canLearn && learn ? learnWord : null)
  }

  const title = flow.mode === 'edit' ? 'Edit expense' : base.manual ? 'Add expense' : 'Confirm expense'
  const mic = speechSupported()

  return (
    <Sheet title={title} onClose={discardDraft} label={title}>
      <div className="confirm">
        {flow.drafts.length > 1 && <p className="step">Expense {flow.index + 1} of {flow.drafts.length}</p>}
        {base.rawTranscript && flow.mode === 'new' && <p className="heard">Heard: “{base.rawTranscript}”</p>}

        <div className={`field ${needAmount ? 'need' : ''}`}>
          <label htmlFor="cf-amount">Amount</label>
          <div className="amount-wrap">
            <span className="sym">{sym}</span>
            <input id="cf-amount" className="input amount" inputMode="decimal" value={amountStr} onChange={(e) => setAmountStr(e.target.value.replace(/[^\d.,]/g, ''))} placeholder="0" autoFocus={needAmount && base.manual} />
            {needAmount && mic && !base.manual && (
              <button className="icon-btn mic-mini" aria-label="Say the amount" onClick={() => voice.start('amount')}><IconMic size={22} /></button>
            )}
          </div>
          {needAmount && !base.manual && <p className="ask">How much was it?</p>}
        </div>

        <div className={`field ${needCategory ? 'need' : ''}`} role="group" aria-label="Category">
          <div className="label-row">
            <span className="label">Category</span>
            {needCategory && mic && (
              <button className="icon-btn mic-mini" aria-label="Say the category" onClick={() => voice.start('category')}><IconMic size={22} /></button>
            )}
          </div>
          {askCategory && <p className="ask">Which category?</p>}
          {voice.on && <p className="listening-line" aria-live="polite">Listening… {voice.text}</p>}
          {voice.msg && <p className="hint">{voice.msg}</p>}
          <div className="chips">
            {categories.map((c) => (
              <button key={c.id} type="button" className={`chip ${category === c.name ? 'on' : ''}`} style={{ '--c': c.color }} aria-pressed={category === c.name} onClick={() => setCategory(c.name)}>
                <span aria-hidden="true">{c.emoji}</span> {c.name}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label htmlFor="cf-desc">Description</label>
          <input id="cf-desc" className="input" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What was it for?" autoComplete="off" />
          {canLearn && (
            <label className="check">
              <input type="checkbox" checked={learn} onChange={(e) => setLearn(e.target.checked)} />
              <span>Remember “{learnWord}” as {category}</span>
            </label>
          )}
        </div>

        <div className="two">
          <div className="field">
            <label htmlFor="cf-date">Date</label>
            <input id="cf-date" className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>

        <div className="field" role="group" aria-label="Payment method">
          <span className="label">Payment</span>
          <div className="chips">
            {[...PAYMENT_METHODS, null].map((m) => (
              <button key={m || 'none'} type="button" className={`chip ${payment === m ? 'on' : ''}`} aria-pressed={payment === m} onClick={() => setPayment(m)}>
                {m || 'Not set'}
              </button>
            ))}
          </div>
        </div>

        <div className="actions">
          <button className="btn ghost" onClick={discardDraft}>{flow.mode === 'edit' ? 'Cancel' : 'Discard'}</button>
          <button className="btn primary" disabled={!canSave} onClick={save}>
            {flow.mode === 'edit' ? 'Update' : flow.drafts.length > 1 && flow.index + 1 < flow.drafts.length ? 'Save & next' : 'Save'}
          </button>
        </div>
        {!canSave && !busy && <p className="hint center-text">{needAmount ? 'Enter an amount to save.' : 'Pick a category to save.'}</p>}
      </div>
    </Sheet>
  )
}
