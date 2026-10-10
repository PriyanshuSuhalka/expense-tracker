import { useApp } from '../state/store.jsx'

export default function Toast() {
  const { toast, dismissToast } = useApp()
  if (!toast) return null
  return (
    <div className="toast" role="status" aria-live="polite" key={toast.id}>
      <span>{toast.message}</span>
      {toast.action && (
        <button className="toast-action" onClick={toast.action.onClick}>{toast.action.label}</button>
      )}
      {toast.action && <span className="toast-timer" aria-hidden="true" />}
      <button className="toast-x" aria-label="Dismiss" onClick={dismissToast}>✕</button>
    </div>
  )
}
