import { IconHome, IconCal, IconTag, IconGear, IconMic } from './Icons.jsx'
import { useApp } from '../state/store.jsx'

const TABS = [
  ['/', 'Home', IconHome],
  ['/month', 'Month', IconCal],
  null,
  ['/categories', 'Categories', IconTag],
  ['/settings', 'Settings', IconGear],
]

const TabIcon = ({ icon: Icon }) => <Icon />

export default function TabBar({ path }) {
  const { openCapture } = useApp()
  return (
    <nav className="tabbar" aria-label="Main">
      {TABS.map((t) =>
        t ? (
          <a key={t[0]} href={`#${t[0]}`} className={`tab ${path === t[0] ? 'on' : ''}`} aria-current={path === t[0] ? 'page' : undefined}>
            <TabIcon icon={t[2]} />
            <span>{t[1]}</span>
          </a>
        ) : (
          <div key="mic" className="mic-slot">
            <button className="mic-btn" aria-label="Add expense by voice" onClick={() => openCapture()}>
              <IconMic />
            </button>
          </div>
        ),
      )}
    </nav>
  )
}
