import { useNavigate, useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { projectsApi, testCasesApi } from '../api/client'
import StatusBadge from '../components/StatusBadge'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'

function relativeTime(dateStr) {
  if (!dateStr) return '—'
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diffMs / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function TestCasesPage() {
  const { projectId } = useParams()
  const navigate = useNavigate()

  const { data: project } = useQuery({
    queryKey: ['projects', projectId],
    queryFn: () => projectsApi.get(projectId),
  })

  const { data: testCases, isLoading, error } = useQuery({
    queryKey: ['test-cases', projectId],
    queryFn: () => testCasesApi.list(projectId),
    refetchInterval: 30_000,
  })

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-4 flex items-center gap-1">
        <Link to="/projects" className="hover:text-indigo-600 transition-colors">
          Projects
        </Link>
        <span>/</span>
        <span className="text-gray-800 font-medium">
          {project?.name ?? `#${projectId}`}
        </span>
      </nav>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Test Cases</h1>

      {isLoading && <LoadingSpinner />}
      {error && <ErrorMessage error={error} />}

      {testCases && (
        testCases.length === 0 ? (
          <p className="text-gray-500 text-sm">No test cases recorded yet.</p>
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
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {testCases.map((tc) => (
                  <tr
                    key={tc.id}
                    onClick={() =>
                      navigate(`/projects/${projectId}/test-cases/${tc.id}`)
                    }
                    className="hover:bg-indigo-50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {tc.name}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge
                        status={tc.latest_execution?.status ?? null}
                      />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {relativeTime(tc.latest_execution?.reported_at)}
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-indigo-600 hover:text-indigo-800">
                      History →
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
