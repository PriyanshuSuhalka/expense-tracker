const Ctor = () => window.SpeechRecognition || window.webkitSpeechRecognition

export const speechSupported = () => !!Ctor()

export const SPEECH_ERRORS = {
  'not-allowed': 'Microphone access is blocked. Tap the lock icon next to the address bar (or Chrome menu → Settings → Site settings → Microphone), allow this site, then try again.',
  'service-not-allowed': 'Speech recognition is turned off for this browser. Check Chrome’s microphone permission, or type instead.',
  'no-speech': 'I didn’t hear anything. Tap the mic and try again.',
  'audio-capture': 'I couldn’t use the microphone. Check that no other app is using it, then try again.',
  network: 'Speech recognition needs an internet connection. You can type the expense instead, or use your keyboard’s mic button.',
  'language-not-supported': 'That speech language isn’t supported. Change it in Settings.',
}
export const errorMessage = (code) => SPEECH_ERRORS[code] || `Speech recognition failed (${code}). You can type instead.`

/**
 * Wraps one SpeechRecognition session.
 * handlers: onStart, onInterim(text), onFinal(alternatives[]), onError(code), onEnd()
 * Returns { stop, abort }.
 */
export function listen(lang, h) {
  const SR = Ctor()
  const rec = new SR()
  rec.lang = lang
  rec.interimResults = true
  rec.continuous = false // continuous mode is unreliable on Android
  rec.maxAlternatives = 3

  let finals = []
  let errored = false
  rec.onstart = () => h.onStart?.()
  rec.onresult = (ev) => {
    let interim = ''
    for (let i = ev.resultIndex; i < ev.results.length; i++) {
      const res = ev.results[i]
      if (res.isFinal) {
        finals = [...res].map((a) => a.transcript.trim()).filter(Boolean)
      } else {
        interim += res[0].transcript
      }
    }
    if (interim) h.onInterim?.(interim.trim())
    else if (finals.length) h.onInterim?.(finals[0])
  }
  rec.onerror = (ev) => {
    if (ev.error === 'aborted') return
    errored = true
    h.onError?.(ev.error)
  }
  rec.onend = () => {
    if (!errored) {
      if (finals.length) h.onFinal?.(finals)
      else h.onError?.('no-speech')
    }
    h.onEnd?.()
  }
  try {
    rec.start()
  } catch {
    errored = true
    h.onError?.('audio-capture')
  }
  return { stop: () => { try { rec.stop() } catch { /* already stopped */ } }, abort: () => { errored = true; try { rec.abort() } catch { /* ignore */ } } }
}
