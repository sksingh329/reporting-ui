import { useParams, Link, useNavigate } from 'react-router-dom'
import { useState, useMemo, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { testCasesApi } from '../api/client'
import StatusBadge from '../components/StatusBadge'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import LogModal from '../components/LogModal'
import { relativeTime } from '../utils/dateUtils'
import { useSettings } from '../context/SettingsContext'
import { useEnvironment } from '../context/EnvironmentContext'

const PAGE_SIZE = 20
const STATUS_OPTIONS = ['all', 'passed', 'failed', 'skipped', 'error']

// ── Sort icon ─────────────────────────────────────────────────────────────────

function SortIcon({ direction }) {
  if (!direction) return <span className="ml-1 text-gray-300 dark:text-gray-600">↕</span>
  return <span className="ml-1 text-indigo-500">{direction === 'asc' ? '↑' : '↓'}</span>
}

// ── Sortable header cell ──────────────────────────────────────────────────────

function SortTh({ children, sortKey, currentKey, direction, onSort, className = '' }) {
  return (
    <th
      className={`px-4 py-0 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider select-none ${className}`}
    >
      {/* Label row — clickable for sorting */}
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className="flex items-center gap-0.5 w-full py-2.5 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
      >
        {children}
        <SortIcon direction={currentKey === sortKey ? direction : null} />
      </button>
    </th>
  )
}

export default function TestCasesPage() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const [nameFilter, setNameFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortKey, setSortKey] = useState('name')
  const [sortDir, setSortDir] = useState('asc')
  const [page, setPage] = useState(1)
  const [logModal, setLogModal] = useState(null)
  const { log_popup_theme } = useSettings()
  const { selectedEnv } = useEnvironment()

  // Reset to page 1 when filters / sort / env change
  useEffect(() => { setPage(1) }, [nameFilter, statusFilter, sortKey, sortDir, selectedEnv])

  const { data: testCases, isLoading, error } = useQuery({
    queryKey: ['test-cases', projectId, selectedEnv ?? 'all'],
    queryFn: () => testCasesApi.list(projectId, selectedEnv),
    refetchInterval: 30_000,
  })

  function handleSort(key) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
    setPage(1)
  }

  const processed = useMemo(() => {
    if (!testCases) return []

    // Filter
    let rows = testCases.filter((tc) => {
      const matchName = tc.name.toLowerCase().includes(nameFilter.toLowerCase())
      const status = tc.latest_execution?.status ?? null
      const matchStatus = statusFilter === 'all' || status === statusFilter
      return matchName && matchStatus
    })

    // Sort
    rows = [...rows].sort((a, b) => {
      let av, bv
      switch (sortKey) {
        case 'name':
          av = a.name.toLowerCase(); bv = b.name.toLowerCase(); break
        case 'status':
          av = a.latest_execution?.status ?? ''; bv = b.latest_execution?.status ?? ''; break
        case 'environment':
          av = a.latest_execution?.environment ?? ''; bv = b.latest_execution?.environment ?? ''; break
        case 'last_run':
          av = a.latest_execution?.reported_at ?? ''; bv = b.latest_execution?.reported_at ?? ''; break
        case 'total_runs':
          av = a.total_executions ?? 0; bv = b.total_executions ?? 0; break
        default:
          av = ''; bv = ''
      }
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })

    return rows
  }, [testCases, nameFilter, statusFilter, sortKey, sortDir])

  const totalPages = Math.max(1, Math.ceil(processed.length / PAGE_SIZE))
  const pageRows   = processed.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const sortProps = { currentKey: sortKey, direction: sortDir, onSort: handleSort }

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

      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Test Reports</h1>
        {selectedEnv && (
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700">
            {selectedEnv}
          </span>
        )}
      </div>

      {isLoading && <LoadingSpinner />}
      {error && <ErrorMessage error={error} />}

      {testCases && (
        processed.length === 0 && !nameFilter && statusFilter === 'all' ? (
          <p className="text-gray-500 dark:text-gray-400 text-sm">No test cases recorded yet.</p>
        ) : (
          <>
            <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
              <table className="min-w-full">
                <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                  {/* Sort header row */}
                  <tr>
                    <SortTh sortKey="name"        {...sortProps} className="w-2/5">Test Name</SortTh>
                    <SortTh sortKey="status"      {...sortProps}>Status</SortTh>
                    <SortTh sortKey="environment" {...sortProps}>Environment</SortTh>
                    <SortTh sortKey="last_run"    {...sortProps}>Last Run</SortTh>
                    <SortTh sortKey="total_runs"  {...sortProps}>Runs</SortTh>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Logs</th>
                  </tr>
                  {/* Column filter row */}
                  <tr className="border-t border-gray-100 dark:border-gray-700">
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        value={nameFilter}
                        onChange={(e) => setNameFilter(e.target.value)}
                        placeholder="Filter by name…"
                        className="w-full rounded border border-gray-200 dark:border-gray-600 px-2.5 py-1 text-xs bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full rounded border border-gray-200 dark:border-gray-600 px-2 py-1 text-xs bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>{s === 'all' ? 'All' : s}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-2 text-xs text-gray-400 dark:text-gray-500 italic">
                      {selectedEnv ? selectedEnv : 'All'}
                    </td>
                    <td colSpan={3} className="px-4 py-2 text-right">
                      {(nameFilter || statusFilter !== 'all') && (
                        <button
                          onClick={() => { setNameFilter(''); setStatusFilter('all') }}
                          className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        >
                          Clear filters
                        </button>
                      )}
                    </td>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {pageRows.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-400 dark:text-gray-500">
                        No results match your filters.
                      </td>
                    </tr>
                  ) : (
                    pageRows.map((tc) => (
                      <tr
                        key={tc.id}
                        onClick={() => navigate(`/projects/${projectId}/test-reports/${tc.id}`)}
                        className="hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors cursor-pointer"
                      >
                        <td className="px-4 py-3 text-sm font-medium text-indigo-600 dark:text-indigo-400">
                          {tc.name}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={tc.latest_execution?.status ?? null} />
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                          {tc.latest_execution?.environment ?? <span className="text-gray-300 dark:text-gray-600">—</span>}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                          {relativeTime(tc.latest_execution?.reported_at)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                          {tc.total_executions ?? 0}
                        </td>
                        <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
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
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {processed.length > PAGE_SIZE && (
              <div className="flex items-center justify-between mt-4 px-1">
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  Showing {Math.min((page - 1) * PAGE_SIZE + 1, processed.length)}–{Math.min(page * PAGE_SIZE, processed.length)} of {processed.length}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 rounded text-xs font-medium border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    ← Prev
                  </button>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {page} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1 rounded text-xs font-medium border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </>
        )
      )}
    </div>
  )
}
