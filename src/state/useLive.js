import { useEffect, useState } from 'react'
import { liveQuery } from 'dexie'

/** Subscribe to a Dexie query; re-renders whenever the underlying data changes. */
export function useLive(query, deps, initial) {
  const [value, setValue] = useState(initial)
  useEffect(() => {
    const sub = liveQuery(query).subscribe({ next: setValue, error: (e) => console.error(e) })
    return () => sub.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  return value
}

export function useRoute() {
  const [hash, setHash] = useState(window.location.hash)
  useEffect(() => {
    const on = () => setHash(window.location.hash)
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  const [path, q] = hash.replace(/^#/, '').split('?')
  return { path: path || '/', query: new URLSearchParams(q || '') }
}
