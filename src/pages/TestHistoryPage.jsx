import { useParams } from 'react-router-dom'
import { useQuery, useQueries } from '@tanstack/react-query'
import { testCasesApi, executionsApi } from '../api/client'
import StatusBadge from '../components/StatusBadge'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import { formatDateTime, toDate } from '../utils/dateUtils'

export default function TestHistoryPage() {
  const { projectId } = useParams()

  const { data: testCases, isLoading: casesLoading, error: casesError } = useQuery({
    queryKey: ['test-cases', projectId],
    queryFn: () => testCasesApi.list(projectId),
  })

  const executionQueries = useQueries({
    queries: (testCases ?? []).map((tc) => ({
      queryKey: ['executions', projectId, String(tc.id)],
      queryFn: () =>
        executionsApi
          .list(projectId, tc.id)
          .then((execs) => execs.map((e) => ({ ...e, test_name: tc.name, test_case_id: tc.id }))),
      enabled: !!testCases,
    })),
  })

  const allLoaded = executionQueries.every((q) => !q.isLoading)

  const allExecutions = executionQueries
    .flatMap((q) => q.data ?? [])
    .sort((a, b) => toDate(b.reported_at) - toDate(a.reported_at))

  const isLoading = casesLoading || !allLoaded

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Test History</h1>

      {isLoading && <LoadingSpinner />}
      {casesError && <ErrorMessage error={casesError} />}

      {!isLoading && allExecutions.length === 0 && (
        <p className="text-gray-500 text-sm">No executions recorded yet.</p>
      )}

      {!isLoading && allExecutions.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Test Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Message
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {allExecutions.map((exec) => (
                <tr key={`${exec.test_case_id}-${exec.id}`} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{exec.test_name}</td>
                  <td className="px-6 py-4">
                    <StatusBadge status={exec.status} />
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {exec.duration_ms != null ? `${exec.duration_ms}ms` : '—'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{formatDateTime(exec.reported_at)}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                    {exec.error_message ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
