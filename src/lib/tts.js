export function speak(text, lang = 'en-IN') {
  try {
    if (!('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = lang
    window.speechSynthesis.speak(u)
  } catch { /* TTS is optional */ }
}
