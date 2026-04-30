import { useParams, Link } from 'react-router-dom'
import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { testCasesApi } from '../api/client'
import StatusBadge from '../components/StatusBadge'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import LogModal from '../components/LogModal'
import { relativeTime } from '../utils/dateUtils'
import { useSettings } from '../context/SettingsContext'

const STATUS_OPTIONS = ['all', 'passed', 'failed', 'skipped', 'error']

export default function TestCasesPage() {
  const { projectId } = useParams()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [logModal, setLogModal] = useState(null)
  const { log_popup_theme } = useSettings()

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
          defaultTheme={log_popup_theme}
          onClose={() => setLogModal(null)}
        />
      )}
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-5">Test Reports</h1>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search test name…"
          className="w-64 rounded-md border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
        />
        <div className="flex items-center gap-1 rounded-md border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 p-1 shadow-sm">
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors capitalize ${
                statusFilter === s
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        {(search || statusFilter !== 'all') && (
          <button
            onClick={() => { setSearch(''); setStatusFilter('all') }}
            className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {isLoading && <LoadingSpinner />}
      {error && <ErrorMessage error={error} />}

      {testCases && (
        filtered.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {testCases.length === 0 ? 'No test cases recorded yet.' : 'No results match your filters.'}
          </p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Test Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Latest Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Last Run
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Logs
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filtered.map((tc) => (
                  <tr
                    key={tc.id}
                    className="hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm font-medium">
                      <Link
                        to={`/projects/${projectId}/test-reports/${tc.id}`}
                        className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 hover:underline"
                      >
                        {tc.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge
                        status={tc.latest_execution?.status ?? null}
                      />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {relativeTime(tc.latest_execution?.reported_at)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {(tc.latest_execution?.log || tc.latest_execution?.error_message || tc.latest_execution?.screenshots?.length > 0) ? (
                        <button
                          onClick={() => setLogModal(tc)}
                          className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 border border-indigo-200 dark:border-indigo-700 hover:border-indigo-400 dark:hover:border-indigo-500 rounded px-2.5 py-1 transition-colors"
                        >
                          View Logs
                        </button>
                      ) : (
                          <span className="text-xs text-gray-300 dark:text-gray-600">—</span>
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
