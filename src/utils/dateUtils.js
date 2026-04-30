// Backend timestamps have no timezone suffix (e.g. "2026-04-24T21:46:41.039778").
// Appending "Z" tells JavaScript to treat them as UTC so formatting
// correctly converts to the user's configured timezone.
function toUtcDate(dateStr) {
  if (!dateStr) return null
  const s = String(dateStr)
  // Already has timezone info
  if (s.endsWith('Z') || s.includes('+') || /\d-\d{2}:\d{2}$/.test(s)) {
    return new Date(s)
  }
  return new Date(s + 'Z')
}

// Runtime-settable timezone (updated by SettingsContext)
let _timezone = 'UTC'
export function setTimezone(tz) { _timezone = tz || 'UTC' }
export function getTimezone() { return _timezone }

export function formatDateTime(dateStr) {
  if (!dateStr) return '—'
  return toUtcDate(dateStr).toLocaleString(undefined, {
    timeZone: _timezone,
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

export function formatDuration(ms, unit = 'ms') {
  if (ms == null) return '—'
  if (unit === 's') return `${(ms / 1000).toFixed(2)}s`
  if (unit === 'm') return `${(ms / 60000).toFixed(2)}m`
  return `${ms}ms`
}
