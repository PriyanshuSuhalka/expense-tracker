import { useEffect } from 'react'
import { AppProvider, useApp } from './state/store.jsx'
import { useRoute } from './state/useLive.js'
import TabBar from './components/TabBar.jsx'
import Toast from './components/Toast.jsx'
import Dialog from './components/Dialog.jsx'
import CaptureSheet from './components/CaptureSheet.jsx'
import ConfirmSheet from './components/ConfirmSheet.jsx'
import { IconPlus } from './components/Icons.jsx'
import Home from './screens/Home.jsx'
import Month from './screens/Month.jsx'
import Categories from './screens/Categories.jsx'
import Settings from './screens/Settings.jsx'

const SCREENS = { '/': Home, '/month': Month, '/categories': Categories, '/settings': Settings }

function Shell() {
  const { ready, flow, openManual, openCapture } = useApp()
  const { path, query } = useRoute()

  // "Add by voice" app shortcut opens #/?capture=1
  useEffect(() => {
    if (ready && query.get('capture') === '1') {
      openCapture({ autoStart: true })
      window.history.replaceState(null, '', window.location.pathname + window.location.search + '#/')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, query.get('capture')])

  if (!ready) return <div className="splash" aria-busy="true">Loading…</div>
  const Screen = SCREENS[path] || Home
  return (
    <>
      <main className="main"><Screen /></main>
      <button className="fab-add" aria-label="Add expense manually" onClick={openManual}><IconPlus /></button>
      <TabBar path={SCREENS[path] ? path : '/'} />
      <CaptureSheet />
      {flow && <ConfirmSheet key={`${flow.mode}-${flow.index}-${flow.drafts[flow.index].id || ''}`} />}
      <Toast />
      <Dialog />
    </>
  )
}

export default function App() {
  return <AppProvider><Shell /></AppProvider>
}
