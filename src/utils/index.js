// Small shared helpers. Kept dependency-free on purpose.

// Conditional className joiner (tiny clsx replacement).
export function cn(...parts) {
  return parts.flat().filter(Boolean).join(' ')
}

// --- Date / time helpers ---------------------------------------------------

export function atToday(hours, minutes = 0, dayOffset = 0) {
  const d = new Date()
  d.setDate(d.getDate() + dayOffset)
  d.setHours(hours, minutes, 0, 0)
  return d
}

export function isSameDay(a, b) {
  const x = new Date(a), y = new Date(b)
  return x.getFullYear() === y.getFullYear() && x.getMonth() === y.getMonth() && x.getDate() === y.getDate()
}

export function isToday(d) { return isSameDay(d, new Date()) }

export function isPast(d) { return new Date(d).getTime() < Date.now() }

export function fmtTime(d) {
  return new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
}

export function fmtDayLong(d = new Date()) {
  return new Date(d).toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

export function fmtDayShort(d) {
  return new Date(d).toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' })
}

// Human "time ago" / "in x" relative string.
export function relTime(d) {
  const diff = new Date(d).getTime() - Date.now()
  const abs = Math.abs(diff)
  const mins = Math.round(abs / 60000)
  const hrs = Math.round(abs / 3600000)
  const days = Math.round(abs / 86400000)
  let label
  if (mins < 1) label = 'just now'
  else if (mins < 60) label = `${mins}m`
  else if (hrs < 24) label = `${hrs}h`
  else label = `${days}d`
  if (label === 'just now') return label
  return diff < 0 ? `${label} ago` : `in ${label}`
}

export function greetingFor(date = new Date()) {
  const h = date.getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}
