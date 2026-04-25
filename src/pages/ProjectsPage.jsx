import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { projectsApi } from '../api/client'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'

export default function ProjectsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [newName, setNewName] = useState('')
  const [formError, setFormError] = useState('')

  const { data: projects, isLoading, error } = useQuery({
    queryKey: ['projects'],
    queryFn: projectsApi.list,
  })

  const createMutation = useMutation({
    mutationFn: projectsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      setNewName('')
      setFormError('')
    },
    onError: (err) => {
      setFormError(err?.response?.data?.detail || err.message)
    },
  })

  const handleCreate = (e) => {
    e.preventDefault()
    const name = newName.trim()
    if (!name) {
      setFormError('Project name is required.')
      return
    }
    createMutation.mutate(name)
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Projects</h1>

      {/* Create project form */}
      <form onSubmit={handleCreate} className="flex gap-3 mb-8">
        <input
          type="text"
          value={newName}
          onChange={(e) => {
            setNewName(e.target.value)
            setFormError('')
          }}
          placeholder="New project name"
          className="flex-1 max-w-sm rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
        <button
          type="submit"
          disabled={createMutation.isPending}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {createMutation.isPending ? 'Creating…' : '+ New Project'}
        </button>
      </form>

      {formError && (
        <p className="text-red-600 text-sm mb-4">{formError}</p>
      )}

      {isLoading && <LoadingSpinner />}
      {error && <ErrorMessage error={error} />}

      {projects && (
        projects.length === 0 ? (
          <p className="text-gray-500 text-sm">No projects yet. Create one above.</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {projects.map((project) => (
                  <tr
                    key={project.id}
                    onClick={() => navigate(`/projects/${project.id}`)}
                    className="hover:bg-indigo-50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 text-sm text-gray-400">
                      #{project.id}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {project.name}
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-indigo-600 hover:text-indigo-800">
                      View →
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
