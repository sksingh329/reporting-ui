import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'

function ImageModal({ screenshots, index, onClose, onPrev, onNext }) {
  const sc = screenshots[index]
  const hasPrev = index > 0
  const hasNext = index < screenshots.length - 1

  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'ArrowLeft') { if (hasPrev) onPrev() }
      else if (e.key === 'ArrowRight') { if (hasNext) onNext() }
      else if (e.key === 'Escape') { onClose() }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [hasPrev, hasNext, onPrev, onNext, onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
      onClick={onClose}
    >
      {/* Close */}
      <button
        className="absolute top-4 right-4 text-white text-3xl font-bold leading-none hover:text-gray-300 transition-colors"
        onClick={onClose}
        aria-label="Close"
      >
        ×
      </button>

      {/* Prev arrow */}
      {hasPrev && (
        <button
          className="absolute left-4 top-1/2 -translate-y-1/2 text-white text-5xl font-bold leading-none hover:text-gray-300 transition-colors select-none"
          onClick={(e) => { e.stopPropagation(); onPrev() }}
          aria-label="Previous screenshot"
        >
          ‹
        </button>
      )}

      {/* Image */}
      <div className="flex flex-col items-center gap-2" onClick={(e) => e.stopPropagation()}>
        <img
          src={sc.image_data ?? sc.download_url}
          alt={sc.step_name ?? 'screenshot'}
          className="max-h-[85vh] max-w-[85vw] rounded shadow-2xl object-contain"
        />
        {sc.step_name && (
          <span className="text-white/80 text-sm">{sc.step_name}</span>
        )}
        <span className="text-white/50 text-xs">{index + 1} / {screenshots.length}</span>
      </div>

      {/* Next arrow */}
      {hasNext && (
        <button
          className="absolute right-4 top-1/2 -translate-y-1/2 text-white text-5xl font-bold leading-none hover:text-gray-300 transition-colors select-none"
          onClick={(e) => { e.stopPropagation(); onNext() }}
          aria-label="Next screenshot"
        >
          ›
        </button>
      )}
    </div>
  )
}

import { useQuery } from '@tanstack/react-query'
import { projectsApi, testCasesApi, executionsApi } from '../api/client'
import StatusBadge from '../components/StatusBadge'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'

function formatDateTime(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString()
}

export default function ExecutionsPage() {
  const { projectId, caseId } = useParams()
  const [expandedId, setExpandedId] = useState(null)

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
      <nav className="text-sm text-gray-500 mb-4 flex items-center gap-1">
        <Link to="/projects" className="hover:text-indigo-600 transition-colors">
          Projects
        </Link>
        <span>/</span>
        <Link
          to={`/projects/${projectId}`}
          className="hover:text-indigo-600 transition-colors"
        >
          {project?.name ?? `#${projectId}`}
        </Link>
        <span>/</span>
        <span className="text-gray-800 font-medium">
          {testCase?.test_name ?? `#${caseId}`}
        </span>
      </nav>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Execution History</h1>

        {passRate !== null && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">Pass Rate</span>
            <div className="w-32 bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className={`h-2 rounded-full transition-all ${passRateColor}`}
                style={{ width: `${passRate}%` }}
              />
            </div>
            <span className="text-sm font-semibold text-gray-700">
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
          <p className="text-gray-500 text-sm">No executions recorded yet.</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                    Run
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
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Logs
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sorted.map((exec) => {
                  const hasDetail =
                    exec.log ||
                    exec.error_message ||
                    (exec.screenshots && exec.screenshots.length > 0)
                  const isExpanded = expandedId === exec.id

                  return (
                    <Fragment key={exec.id} exec={exec} hasDetail={hasDetail} isExpanded={isExpanded} onToggle={() => setExpandedId(isExpanded ? null : exec.id)} />
                  )
                })}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  )
}

function Fragment({ exec, hasDetail, isExpanded, onToggle }) {
  const [modalIndex, setModalIndex] = useState(null)
  const screenshots = exec.screenshots ?? []
  const openModal = (i) => setModalIndex(i)
  const closeModal = () => setModalIndex(null)
  const goPrev = useCallback(() => setModalIndex((i) => Math.max(0, i - 1)), [])
  const goNext = useCallback(() => setModalIndex((i) => Math.min(screenshots.length - 1, i + 1)), [screenshots.length])
  return (
    <>
      {modalIndex !== null && (
        <ImageModal
          screenshots={screenshots}
          index={modalIndex}
          onClose={closeModal}
          onPrev={goPrev}
          onNext={goNext}
        />
      )}
      <tr className="hover:bg-gray-50 transition-colors">
        <td className="px-6 py-4 text-sm text-gray-400">#{exec.id}</td>
        <td className="px-6 py-4">
          <StatusBadge status={exec.status} />
        </td>
        <td className="px-6 py-4 text-sm text-gray-600">
          {exec.duration_ms != null ? `${exec.duration_ms}ms` : '—'}
        </td>
        <td className="px-6 py-4 text-sm text-gray-500">
          {formatDateTime(exec.reported_at)}
        </td>
        <td className="px-6 py-4 text-right">
          {hasDetail && (
            <button
              onClick={onToggle}
              className="text-indigo-600 text-sm hover:text-indigo-800 font-medium transition-colors"
            >
              {isExpanded ? 'Hide ▲' : 'Show ▼'}
            </button>
          )}
        </td>
      </tr>

      {isExpanded && (
        <tr>
          <td
            colSpan={5}
            className="px-6 py-4 bg-gray-50 border-t border-gray-100"
          >
            {exec.error_message && (
              <p
                className={`text-sm mb-3 font-medium ${
                  exec.status === 'failed'
                    ? 'text-red-700'
                    : 'text-green-700'
                }`}
              >
                {exec.error_message}
              </p>
            )}
            {exec.log && (
              <pre className="text-xs rounded-md bg-gray-900 text-green-400 p-4 overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed">
                {exec.log}
              </pre>
            )}
            {exec.screenshots && exec.screenshots.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Screenshots</p>
                <div className="flex flex-wrap gap-3">
                  {exec.screenshots.map((sc, i) => (
                    <div key={sc.id} className="flex flex-col items-center gap-1">
                      <img
                        src={sc.image_data ?? sc.download_url}
                        alt={sc.step_name ?? 'screenshot'}
                        className="max-h-48 rounded border border-gray-300 object-contain cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => openModal(i)}
                      />
                      {sc.step_name && (
                        <span className="text-xs text-gray-500">{sc.step_name}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  )
}
