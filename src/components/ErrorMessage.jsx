export default function ErrorMessage({ error }) {
  return (
    <div className="rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-red-700 dark:text-red-400 text-sm">
      <strong>Error:</strong>{' '}
      {error?.response?.data?.detail || error?.message || 'Something went wrong.'}
    </div>
  )
}
