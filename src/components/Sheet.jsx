import { useEffect } from 'react'

/** Bottom sheet. The backdrop does not dismiss so a stray tap can't lose a half-edited expense. */
export default function Sheet({ title, onClose, children, label }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose?.()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div className="backdrop">
      <section className="sheet" role="dialog" aria-modal="true" aria-label={label || title}>
        <div className="grab" aria-hidden="true" />
        {(title || onClose) && (
          <header className="sheet-head">
            <h2>{title}</h2>
            {onClose && <button className="icon-btn" aria-label="Close" onClick={onClose}>✕</button>}
          </header>
        )}
        {children}
      </section>
    </div>
  )
}
