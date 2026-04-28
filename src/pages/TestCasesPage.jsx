import { useParams, Link } from 'react-router-dom'
import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { testCasesApi } from '../api/client'
import StatusBadge from '../components/StatusBadge'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import LogModal from '../components/LogModal'
import { relativeTime } from '../utils/dateUtils'

const STATUS_OPTIONS = ['all', 'passed', 'failed', 'skipped', 'error']

export default function TestCasesPage() {
  const { projectId } = useParams()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [logModal, setLogModal] = useState(null)

  const { data: testCases, isLoading, error } = useQuery({
    queryKey: ['test-cases', projectId],
    queryFn: () => testCasesApi.list(projectId),
    refetchInterval: 30_000,
  })

  const filtered = useMemo(() => {
    if (!testCases) return []
    return testCases.filter((tc) => {
      const matchesSearch = tc.name.toLowerCase().includes(search.toLowerCase())
      const status = tc.latest_execution?.status ?? null
      const matchesStatus = statusFilter === 'all' || status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [testCases, search, statusFilter])

  return (
    <div>
      {logModal && (
        <LogModal
          title={logModal.name}
          subtitle="Latest execution log"
          status={logModal.latest_execution?.status}
          log={logModal.latest_execution?.log}
          errorMessage={logModal.latest_execution?.error_message}
          screenshots={logModal.latest_execution?.screenshots ?? []}
          onClose={() => setLogModal(null)}
        />
      )}
      <h1 className="text-2xl font-bold text-gray-900 mb-5">Test Reports</h1>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search test name…"
          className="w-64 rounded-md border border-gray-300 px-3 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
        />
        <div className="flex items-center gap-1 rounded-md border border-gray-200 bg-white p-1 shadow-sm">
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors capitalize ${
                statusFilter === s
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        {(search || statusFilter !== 'all') && (
          <button
            onClick={() => { setSearch(''); setStatusFilter('all') }}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {isLoading && <LoadingSpinner />}
      {error && <ErrorMessage error={error} />}

      {testCases && (
        filtered.length === 0 ? (
          <p className="text-gray-500 text-sm">
            {testCases.length === 0 ? 'No test cases recorded yet.' : 'No results match your filters.'}
          </p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Test Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Latest Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Run
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Logs
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filtered.map((tc) => (
                  <tr
                    key={tc.id}
                    className="hover:bg-indigo-50 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm font-medium">
                      <Link
                        to={`/projects/${projectId}/test-reports/${tc.id}`}
                        className="text-indigo-600 hover:text-indigo-800 hover:underline"
                      >
                        {tc.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge
                        status={tc.latest_execution?.status ?? null}
                      />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {relativeTime(tc.latest_execution?.reported_at)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {(tc.latest_execution?.log || tc.latest_execution?.error_message || tc.latest_execution?.screenshots?.length > 0) ? (
                        <button
                          onClick={() => setLogModal(tc)}
                          className="text-xs font-medium text-indigo-600 hover:text-indigo-800 border border-indigo-200 hover:border-indigo-400 rounded px-2.5 py-1 transition-colors"
                        >
                          View Logs
                        </button>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  )
}
