import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useLive } from './useLive.js'
import { getSettings, listCategories, addExpense, updateExpense, deleteExpense, deleteExpenses, restoreExpense, addKeyword } from '../lib/repo.js'
import { parseAlternatives } from '../lib/parser/parseExpense.js'
import { todayYMD, money } from '../lib/format.js'

const Ctx = createContext(null)
export const useApp = () => useContext(Ctx)

const confident = (d) => d.amount != null && d.confidence?.amount >= 0.8 && d.category && d.confidence?.category >= 0.8

export function AppProvider({ children }) {
  const settings = useLive(getSettings, [], null)
  const categories = useLive(listCategories, [], null)
  const [toast, setToast] = useState(null)
  const [flow, setFlow] = useState(null) // { mode: 'new'|'edit', drafts, index, saved: [] }
  const [capture, setCapture] = useState(null) // { autoStart }
  const [dialog, setDialog] = useState(null)
  const flowRef = useRef(null)
  const timer = useRef()
  flowRef.current = flow

  const dismissToast = useCallback(() => { clearTimeout(timer.current); setToast(null) }, [])
  const showToast = useCallback((message, action) => {
    clearTimeout(timer.current)
    setToast({ message, action, id: Date.now() })
    timer.current = setTimeout(() => setToast(null), action ? 5000 : 3000)
  }, [])
  useEffect(() => () => clearTimeout(timer.current), [])

  const sym = settings?.currencySymbol || '₹'

  const toastSaved = useCallback((rows) => {
    const ids = rows.map((r) => r.id)
    const msg = rows.length === 1 ? `Saved ${money(rows[0].amount, sym)} · ${rows[0].category}` : `Saved ${rows.length} expenses`
    showToast(msg, { label: 'Undo', onClick: () => { deleteExpenses(ids); dismissToast() } })
  }, [showToast, dismissToast, sym])

  const enqueue = useCallback(async (drafts) => {
    if (settings?.autoSave && drafts.length && drafts.every(confident)) {
      const rows = []
      for (const d of drafts) rows.push(await addExpense(d, settings.currencyCode))
      toastSaved(rows)
      return
    }
    setFlow({ mode: 'new', drafts, index: 0, saved: [] })
  }, [settings, toastSaved])

  const submitTranscript = useCallback((alternatives, source = 'voice') => {
    const parsed = parseAlternatives(alternatives, categories || [], new Date())
    if (!parsed.length) { showToast('Couldn’t make sense of that. Try again.'); return }
    const full = parsed.map((p) => p.raw).join(' and ')
    enqueue(parsed.map((p) => ({ ...p, source, rawTranscript: full, parsedCategory: p.category })))
  }, [categories, enqueue, showToast])

  const openManual = useCallback(() => {
    setFlow({
      mode: 'new', index: 0, saved: [],
      drafts: [{ amount: null, category: null, parsedCategory: null, description: '', date: todayYMD(), paymentMethod: null, source: 'manual', rawTranscript: null, confidence: { amount: 1, category: 1 }, manual: true }],
    })
  }, [])
  const openEdit = useCallback((e) => setFlow({ mode: 'edit', index: 0, saved: [], drafts: [{ ...e, parsedCategory: e.category, confidence: { amount: 1, category: 1 }, manual: true }] }), [])

  const advance = useCallback((saved) => {
    const f = flowRef.current
    if (f.index + 1 < f.drafts.length) { setFlow({ ...f, index: f.index + 1, saved }); return }
    setFlow(null)
    if (saved.length) toastSaved(saved)
  }, [toastSaved])

  const saveDraft = useCallback(async (draft, learnWord) => {
    const f = flowRef.current
    if (f.mode === 'edit') {
      await updateExpense(draft.id, draft)
      setFlow(null)
      showToast('Expense updated')
      return
    }
    const row = await addExpense(draft, settings.currencyCode)
    if (learnWord) {
      const cat = categories.find((c) => c.name === draft.category)
      if (cat) await addKeyword(cat.id, learnWord)
    }
    advance([...f.saved, row])
  }, [advance, categories, settings, showToast])

  const discardDraft = useCallback(() => {
    const f = flowRef.current
    if (f.mode === 'edit' || f.drafts.length === 1) { setFlow(null); if (f.saved.length) toastSaved(f.saved); return }
    advance(f.saved)
  }, [advance, toastSaved])

  const removeExpense = useCallback(async (row) => {
    await deleteExpense(row.id)
    showToast('Expense deleted', { label: 'Undo', onClick: () => { restoreExpense(row); dismissToast() } })
  }, [showToast, dismissToast])

  const ask = useCallback((opts) => new Promise((resolve) => setDialog({ ...opts, resolve })), [])
  const closeDialog = (v) => { dialog?.resolve(v); setDialog(null) }

  const value = useMemo(() => ({
    ready: !!(settings && categories), settings, categories: categories || [], sym,
    toast, showToast, dismissToast,
    flow, saveDraft, discardDraft, openManual, openEdit, removeExpense,
    capture, openCapture: (o = {}) => setCapture({ autoStart: true, ...o }), closeCapture: () => setCapture(null), submitTranscript,
    dialog, ask, closeDialog,
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [settings, categories, toast, flow, capture, dialog, sym, saveDraft, discardDraft, submitTranscript])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
