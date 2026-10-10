import { useApp } from '../state/store.jsx'

export default function Dialog() {
  const { dialog, closeDialog } = useApp()
  if (!dialog) return null
  return (
    <div className="backdrop center">
      <div className="dialog" role="alertdialog" aria-modal="true" aria-label={dialog.title}>
        <h2>{dialog.title}</h2>
        {dialog.message && <p>{dialog.message}</p>}
        <div className="row-end">
          <button className="btn ghost" onClick={() => closeDialog(false)}>{dialog.cancelLabel || 'Cancel'}</button>
          <button className={`btn ${dialog.danger ? 'danger' : 'primary'}`} onClick={() => closeDialog(true)}>{dialog.confirmLabel || 'OK'}</button>
        </div>
      </div>
    </div>
  )
}
