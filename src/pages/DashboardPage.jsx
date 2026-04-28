import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { testCasesApi } from '../api/client'
import StatusBadge from '../components/StatusBadge'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import { relativeTime, toDate } from '../utils/dateUtils'

function StatCard({ label, value, valueClass }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-3xl font-bold ${valueClass ?? 'text-gray-900'}`}>{value}</p>
    </div>
  )
}

export default function DashboardPage() {
  const { projectId } = useParams()

  const { data: testCases, isLoading, error } = useQuery({
    queryKey: ['test-cases', projectId],
    queryFn: () => testCasesApi.list(projectId),
    refetchInterval: 30_000,
  })

  const total = testCases?.length ?? 0
  const passed = testCases?.filter((tc) => tc.latest_execution?.status === 'passed').length ?? 0
  const failed = testCases?.filter((tc) => tc.latest_execution?.status === 'failed').length ?? 0
  const withRuns = testCases?.filter((tc) => tc.latest_execution).length ?? 0
  const passRate = withRuns > 0 ? Math.round((passed / withRuns) * 100) : null

  const recentFailures = testCases
    ?.filter((tc) => tc.latest_execution?.status === 'failed')
    .sort(
      (a, b) =>
        toDate(b.latest_execution.reported_at) -
        toDate(a.latest_execution.reported_at)
    ) ?? []

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      {isLoading && <LoadingSpinner />}
      {error && <ErrorMessage error={error} />}

      {testCases && (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard label="Total Tests" value={total} />
            <StatCard label="Passing" value={passed} valueClass="text-green-600" />
            <StatCard label="Failing" value={failed} valueClass={failed > 0 ? 'text-red-600' : 'text-gray-900'} />
            <StatCard
              label="Pass Rate"
              value={passRate != null ? `${passRate}%` : '—'}
              valueClass={
                passRate == null
                  ? 'text-gray-400'
                  : passRate >= 70
                  ? 'text-green-600'
                  : passRate >= 40
                  ? 'text-yellow-600'
                  : 'text-red-600'
              }
            />
          </div>

          {/* Recent failures */}
          {recentFailures.length > 0 && (
            <div className="rounded-lg border border-red-100 bg-white shadow-sm mb-6">
              <div className="px-6 py-3 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-700">Recent Failures</h2>
                <span className="text-xs text-red-500 font-medium">{recentFailures.length} failing</span>
              </div>
              <table className="min-w-full divide-y divide-gray-100">
                <tbody className="divide-y divide-gray-100">
                  {recentFailures.slice(0, 5).map((tc) => (
                    <tr key={tc.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3 text-sm font-medium text-gray-900">{tc.name}</td>
                      <td className="px-6 py-3 text-sm text-gray-400">
                        {relativeTime(tc.latest_execution?.reported_at)}
                      </td>
                      <td className="px-6 py-3 text-sm text-red-600 max-w-xs truncate">
                        {tc.latest_execution?.error_message ?? ''}
                      </td>
                      <td className="px-6 py-3 text-right">
                        <Link
                          to={`/projects/${projectId}/test-reports/${tc.id}`}
                          className="text-indigo-600 text-sm hover:text-indigo-800"
                        >
                          History →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* All test cases */}
          {testCases.length === 0 ? (
            <p className="text-gray-500 text-sm">No test cases yet. Start posting results to the API.</p>
          ) : (
            <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
              <div className="px-6 py-3 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-700">All Test Cases</h2>
                <Link
                  to={`/projects/${projectId}/test-reports`}
                  className="text-xs text-indigo-600 hover:text-indigo-800"
                >
                  View All →
                </Link>
              </div>
              <table className="min-w-full divide-y divide-gray-100">
                <tbody className="divide-y divide-gray-100">
                  {testCases.map((tc) => (
                    <tr key={tc.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3 text-sm font-medium text-gray-900">{tc.name}</td>
                      <td className="px-6 py-3">
                        <StatusBadge status={tc.latest_execution?.status ?? null} />
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-400">
                        {relativeTime(tc.latest_execution?.reported_at)}
                      </td>
                      <td className="px-6 py-3 text-right">
                        <Link
                          to={`/projects/${projectId}/test-reports/${tc.id}`}
                          className="text-xs text-indigo-600 hover:text-indigo-800"
                        >
                          History →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}
