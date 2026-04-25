export default function ErrorMessage({ error }) {
  return (
    <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm">
      <strong>Error:</strong>{' '}
      {error?.response?.data?.detail || error?.message || 'Something went wrong.'}
    </div>
  )
}
