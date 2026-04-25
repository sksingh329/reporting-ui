const STYLES = {
  passed: 'bg-green-100 text-green-800 border-green-200',
  failed: 'bg-red-100 text-red-800 border-red-200',
  skipped: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  error: 'bg-orange-100 text-orange-800 border-orange-200',
}

export default function StatusBadge({ status }) {
  const style =
    STYLES[status?.toLowerCase()] || 'bg-gray-100 text-gray-700 border-gray-200'
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${style}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {status ?? '—'}
    </span>
  )
}
