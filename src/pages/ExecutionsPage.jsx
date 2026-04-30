import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import LogModal from '../components/LogModal'

import { useQuery } from '@tanstack/react-query'
import { projectsApi, testCasesApi, executionsApi } from '../api/client'
import StatusBadge from '../components/StatusBadge'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import { formatDateTime, formatDuration } from '../utils/dateUtils'
import { useSettings } from '../context/SettingsContext'

export default function ExecutionsPage() {
  const { projectId, caseId } = useParams()

  const { data: project } = useQuery({
    queryKey: ['projects', projectId],
    queryFn: () => projectsApi.get(projectId),
  })

  const { data: testCase } = useQuery({
    queryKey: ['test-cases', projectId, caseId],
    queryFn: () => testCasesApi.get(projectId, caseId),
  })

  const { data: executions, isLoading, error } = useQuery({
    queryKey: ['executions', projectId, caseId],
    queryFn: () => executionsApi.list(projectId, caseId),
    refetchInterval: 15_000,
  })

  const passRate =
    executions && executions.length > 0
      ? Math.round(
          (executions.filter((e) => e.status === 'passed').length /
            executions.length) *
            100
        )
      : null

  // Show newest runs first
  const sorted = executions
    ? [...executions].sort((a, b) => b.id - a.id)
    : []

  const passRateColor =
    passRate == null
      ? 'bg-gray-400'
      : passRate >= 70
      ? 'bg-green-500'
      : passRate >= 40
      ? 'bg-yellow-500'
      : 'bg-red-500'

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 dark:text-gray-400 mb-4 flex items-center gap-1">
        <Link to={`/projects/${projectId}/dashboard`} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
          {project?.name ?? `#${projectId}`}
        </Link>
        <span>/</span>
        <Link to={`/projects/${projectId}/test-reports`} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
          Test Reports
        </Link>
        <span>/</span>
        <span className="text-gray-800 dark:text-gray-200 font-medium">
          {testCase?.name ?? `#${caseId}`}
        </span>
      </nav>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Execution History</h1>

        {passRate !== null && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500 dark:text-gray-400">Pass Rate</span>
            <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
              <div
                className={`h-2 rounded-full transition-all ${passRateColor}`}
                style={{ width: `${passRate}%` }}
              />
            </div>
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
              {passRate}%
            </span>
            <span className="text-xs text-gray-400">
              ({executions.filter((e) => e.status === 'passed').length}/
              {executions.length} runs)
            </span>
          </div>
        )}
      </div>

      {isLoading && <LoadingSpinner />}
      {error && <ErrorMessage error={error} />}

      {executions && (
        executions.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-sm">No executions recorded yet.</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-20">
                    Run
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Logs
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {sorted.map((exec) => {
                  const hasDetail =
                    exec.log ||
                    exec.error_message ||
                    (exec.screenshots && exec.screenshots.length > 0)

                  return (
                    <ExecRow key={exec.id} exec={exec} hasDetail={hasDetail} />
                  )
                  // note: duration_unit and log_popup_theme read inside ExecRow via useSettings
                })}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  )
}

function ExecRow({ exec, hasDetail }) {
  const [open, setOpen] = useState(false)
  const { log_popup_theme, duration_unit } = useSettings()

  return (
    <>
      {open && (
        <LogModal
          title={`Run #${exec.id}`}
          subtitle={formatDateTime(exec.reported_at)}
          status={exec.status}
          log={exec.log}
          errorMessage={exec.error_message}
          screenshots={exec.screenshots ?? []}
          defaultTheme={log_popup_theme}
          onClose={() => setOpen(false)}
        />
      )}

      <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
        <td className="px-6 py-4 text-sm text-gray-400">#{exec.id}</td>
        <td className="px-6 py-4">
          <StatusBadge status={exec.status} />
        </td>
        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
          {formatDuration(exec.duration_ms, duration_unit)}
        </td>
        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
          {formatDateTime(exec.reported_at)}
        </td>
        <td className="px-6 py-4 text-right">
          {hasDetail ? (
            <button
              onClick={() => setOpen(true)}
              className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 border border-indigo-200 dark:border-indigo-700 hover:border-indigo-400 dark:hover:border-indigo-500 rounded px-2.5 py-1 transition-colors"
            >
              View Logs
            </button>
          ) : (
            <span className="text-xs text-gray-300 dark:text-gray-600">—</span>
          )}
        </td>
      </tr>
    </>
  )
}
