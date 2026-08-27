import { useEffect, useState } from 'react'

// Persist a piece of state to localStorage. Used for settings, tasks and quick links
// so the mock app remembers user edits between browser sessions.
export function useLocalStorage(key, initialValue, deserialize = value => value) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key)
      return raw != null ? deserialize(JSON.parse(raw)) : initialValue
    } catch {
      return initialValue
    }
  })

  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* storage unavailable */ }
  }, [key, value])

  return [value, setValue]
}
