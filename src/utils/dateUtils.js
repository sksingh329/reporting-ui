// Backend timestamps have no timezone suffix (e.g. "2026-04-24T21:46:41.039778").
// Appending "Z" tells JavaScript to treat them as UTC so toLocaleString()
// correctly converts to the client's local timezone.
function toUtcDate(dateStr) {
  if (!dateStr) return null
  const s = String(dateStr)
  // Already has timezone info
  if (s.endsWith('Z') || s.includes('+') || /\d-\d{2}:\d{2}$/.test(s)) {
    return new Date(s)
  }
  return new Date(s + 'Z')
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '—'
  return toUtcDate(dateStr).toLocaleString(undefined, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

export function relativeTime(dateStr) {
  if (!dateStr) return '—'
  const diffMs = Date.now() - toUtcDate(dateStr).getTime()
  const mins = Math.floor(diffMs / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export function toDate(dateStr) {
  return toUtcDate(dateStr)
}
