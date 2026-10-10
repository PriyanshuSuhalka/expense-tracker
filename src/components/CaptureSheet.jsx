import { useEffect, useRef, useState } from 'react'
import Sheet from './Sheet.jsx'
import { IconMic } from './Icons.jsx'
import { useApp } from '../state/store.jsx'
import { listen, speechSupported, errorMessage } from '../lib/speech.js'

export default function CaptureSheet() {
  const { capture, closeCapture, settings, submitTranscript } = useApp()
  const supported = speechSupported()
  const [phase, setPhase] = useState('idle') // idle | listening | error | text
  const [interim, setInterim] = useState('')
  const [error, setError] = useState(null)
  const [text, setText] = useState('')
  const session = useRef(null)

  const stopSession = () => { session.current?.abort(); session.current = null }

  const start = (auto = false) => {
    stopSession()
    setInterim('')
    setError(null)
    setPhase('listening')
    session.current = listen(settings.speechLang, {
      onInterim: setInterim,
      onFinal: (alts) => { session.current = null; closeCapture(); submitTranscript(alts, 'voice') },
      onError: async (code) => {
        session.current = null
        if (auto && code === 'not-allowed') {
          // Browsers may refuse a mic prompt without a tap (e.g. opened from the home-screen shortcut).
          let state = 'prompt'
          try { state = (await navigator.permissions.query({ name: 'microphone' })).state } catch { /* unsupported */ }
          if (state !== 'denied') { setPhase('idle'); return }
        }
        setError(code)
        setPhase('error')
      },
    })
  }

  useEffect(() => {
    if (!capture) return undefined
    setText('')
    setError(null)
    if (!supported) setPhase('text')
    else if (capture.autoStart) start(true)
    else setPhase('idle')
    return stopSession
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [capture])

  if (!capture) return null

  const close = () => { stopSession(); closeCapture() }
  const submitText = (e) => {
    e.preventDefault()
    if (!text.trim()) return
    closeCapture()
    submitTranscript([text.trim()], 'manual')
  }
  const showText = phase === 'text' || (phase === 'error' && (error === 'network' || !supported))

  return (
    <Sheet title="Add expense" onClose={close}>
      <div className="capture">
        {phase === 'listening' && (
          <>
            <div className="orb listening" aria-hidden="true"><IconMic size={40} /></div>
            <p className="status" aria-live="polite">Listening…</p>
            <p className="transcript" aria-live="polite">{interim || 'Say e.g. “250 groceries at DMart”'}</p>
            <div className="row-end">
              <button className="btn ghost" onClick={() => { stopSession(); setPhase('text') }}>Type instead</button>
              <button className="btn primary" onClick={() => session.current?.stop()}>Done</button>
            </div>
          </>
        )}
        {phase === 'idle' && (
          <>
            <button className="orb" aria-label="Start listening" onClick={() => start()}><IconMic size={40} /></button>
            <p className="status">Tap to speak</p>
            <p className="hint">Try “paid 1200 electricity bill via UPI” or “50 for chai and 120 for auto”.</p>
          </>
        )}
        {phase === 'error' && (
          <>
            <p className="error-text" role="alert">{errorMessage(error)}</p>
            {error !== 'network' && error !== 'not-allowed' && <button className="btn primary" onClick={() => start()}>Try again</button>}
            {error === 'not-allowed' && <button className="btn primary" onClick={() => start()}>I’ve allowed it — retry</button>}
          </>
        )}
        {phase !== 'listening' && (showText || phase === 'idle' || phase === 'error') && (
          <form className="text-fallback" onSubmit={submitText}>
            {!supported && <p className="hint">Voice input isn’t available in this browser. Type below, or use your keyboard’s mic button.</p>}
            <label htmlFor="cap-text" className="sr-only">Type an expense</label>
            <input
              id="cap-text"
              className="input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="e.g. 250 groceries at DMart"
              autoComplete="off"
              enterKeyHint="done"
              autoFocus={showText}
            />
            <button className="btn primary" type="submit" disabled={!text.trim()}>Add</button>
          </form>
        )}
      </div>
    </Sheet>
  )
}
