import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useQueries } from '@tanstack/react-query'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { testCasesApi, executionsApi } from '../api/client'
import StatusBadge from '../components/StatusBadge'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import { relativeTime, toDate } from '../utils/dateUtils'
import { useEnvironment } from '../context/EnvironmentContext'

// ── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, valueClass, sub }) {
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-3xl font-bold ${valueClass ?? 'text-gray-900 dark:text-gray-100'}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

// ── Custom tooltip ────────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const rate = payload[0]?.value
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg px-3 py-2 text-sm">
      <p className="text-gray-500 dark:text-gray-400 mb-0.5">{label}</p>
      <p className="font-semibold text-gray-800 dark:text-gray-100">{rate != null ? `${rate.toFixed(1)}%` : '—'}</p>
      <p className="text-xs text-gray-400">{payload[0]?.payload?.runs} run{payload[0]?.payload?.runs !== 1 ? 's' : ''}</p>
    </div>
  )
}

// ── Pass rate trend chart ─────────────────────────────────────────────────────

function PassRateTrendChart({ projectId, testCases, selectedEnv }) {
  const eligibleCases = (testCases ?? []).filter((tc) => tc.total_executions > 0)

  const execQueries = useQueries({
    queries: eligibleCases.map((tc) => ({
      queryKey: ['executions', projectId, String(tc.id), selectedEnv ?? 'all'],
      queryFn: () => executionsApi.list(projectId, tc.id, selectedEnv),
      staleTime: 30_000,
    })),
  })

  const isLoading = execQueries.some((q) => q.isLoading)

  const chartData = (() => {
    if (isLoading || eligibleCases.length === 0) return []
    const byDate = {}
    execQueries.forEach((q) => {
      ;(q.data ?? []).forEach((exec) => {
        const day = toDate(exec.reported_at).toISOString().slice(0, 10)
        if (!byDate[day]) byDate[day] = { passed: 0, total: 0 }
        byDate[day].total += 1
        if (exec.status === 'passed') byDate[day].passed += 1
      })
    })
    return Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-30)
      .map(([date, { passed, total }]) => ({
        date: new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(
          new Date(date + 'T00:00:00')
        ),
        passRate: total > 0 ? Math.round((passed / total) * 100) : 0,
        runs: total,
      }))
  })()

  const latestRate = chartData.length > 0 ? chartData[chartData.length - 1].passRate : null
  const areaColor =
    latestRate == null ? '#6366f1' : latestRate >= 70 ? '#22c55e' : latestRate >= 40 ? '#eab308' : '#ef4444'

  if (isLoading) {
    return (
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm p-6 mb-8">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4">Pass Rate Trend</h2>
        <div className="h-48 flex items-center justify-center"><LoadingSpinner /></div>
      </div>
    )
  }

  if (chartData.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm p-6 mb-8">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">Pass Rate Trend</h2>
        <p className="text-sm text-gray-400 dark:text-gray-500">No execution data yet.</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Pass Rate Trend</h2>
        <span className="text-xs text-gray-400">Last {chartData.length} day{chartData.length !== 1 ? 's' : ''} with runs</span>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="passRateGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="10%" stopColor={areaColor} stopOpacity={0.25} />
              <stop offset="95%" stopColor={areaColor} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[0, 100]}
            tickFormatter={(v) => `${v}%`}
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            tickLine={false}
            axisLine={false}
            width={48}
          />
          <Tooltip content={<ChartTooltip />} />
          <Area
            type="monotone"
            dataKey="passRate"
            stroke={areaColor}
            strokeWidth={2}
            fill="url(#passRateGradient)"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

// ── Dashboard page ────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const { selectedEnv } = useEnvironment()

  const { data: testCases, isLoading, error } = useQuery({
    queryKey: ['test-cases', projectId, selectedEnv ?? 'all'],
    queryFn: () => testCasesApi.list(projectId, selectedEnv),
    refetchInterval: 30_000,
  })

  const total    = testCases?.length ?? 0
  const passed   = testCases?.filter((tc) => tc.latest_execution?.status === 'passed').length ?? 0
  const failed   = testCases?.filter((tc) => tc.latest_execution?.status === 'failed').length ?? 0
  const withRuns = testCases?.filter((tc) => tc.latest_execution).length ?? 0
  const passRate = withRuns > 0 ? Math.round((passed / withRuns) * 100) : null

  const recentFailures = (testCases ?? [])
    .filter((tc) => tc.latest_execution?.status === 'failed')
    .sort((a, b) => toDate(b.latest_execution.reported_at) - toDate(a.latest_execution.reported_at))

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
        {selectedEnv && (
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700">
            {selectedEnv}
          </span>
        )}
      </div>

      {isLoading && <LoadingSpinner />}
      {error && <ErrorMessage error={error} />}

      {testCases && (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard label="Total Tests" value={total} />
            <StatCard label="Passing" value={passed} valueClass="text-green-600 dark:text-green-400" />
            <StatCard
              label="Failing"
              value={failed}
              valueClass={failed > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-gray-100'}
            />
            <StatCard
              label="Pass Rate"
              value={passRate != null ? `${passRate}%` : '—'}
              sub={withRuns > 0 ? `${passed}/${withRuns} with runs` : undefined}
              valueClass={
                passRate == null
                  ? 'text-gray-400'
                  : passRate >= 70
                  ? 'text-green-600 dark:text-green-400'
                  : passRate >= 40
                  ? 'text-yellow-600 dark:text-yellow-400'
                  : 'text-red-600 dark:text-red-400'
              }
            />
          </div>

          {/* Pass Rate Trend Chart */}
          <PassRateTrendChart projectId={projectId} testCases={testCases} selectedEnv={selectedEnv} />

          {/* Recent Failures */}
          {recentFailures.length > 0 && (
            <div className="rounded-lg border border-red-100 dark:border-red-900/50 bg-white dark:bg-gray-800 shadow-sm">
              <div className="px-6 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Recent Failures</h2>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-red-500 font-medium">{recentFailures.length} failing</span>
                  <Link
                    to={`/projects/${projectId}/test-reports`}
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
                  >
                    View All →
                  </Link>
                </div>
              </div>
              <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-700">
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {recentFailures.slice(0, 5).map((tc) => (
                    <tr
                      key={tc.id}
                      onClick={() => navigate(`/projects/${projectId}/test-reports/${tc.id}`)}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                    >
                      <td className="px-6 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">{tc.name}</td>
                      <td className="px-6 py-3 text-sm text-gray-400">
                        {relativeTime(tc.latest_execution?.reported_at)}
                      </td>
                      <td className="px-6 py-3 text-sm text-red-600 dark:text-red-400 max-w-xs truncate">
                        {tc.latest_execution?.error_message ?? ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {testCases.length === 0 && (
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              No test cases found{selectedEnv ? ` for environment "${selectedEnv}"` : ''}. Start posting results to the API.
            </p>
          )}
        </>
      )}
    </div>
  )
}

