import axios from 'axios'

// In development, Vite proxies /api/* to http://localhost:8000 (see vite.config.js).
// In production, nginx proxies /api/* to the backend service (see nginx.conf).
// Set VITE_API_BASE_URL in .env only if you need to hit a different origin directly.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
})

export const projectsApi = {
  list: () => api.get('/api/projects').then((r) => r.data),
  get: (id) => api.get(`/api/projects/${id}`).then((r) => r.data),
  create: (name) => api.post('/api/projects', { name }).then((r) => r.data),
}

export const testCasesApi = {
  list: (projectId) =>
    api.get(`/api/projects/${projectId}/test-cases`).then((r) => r.data),
  get: (projectId, caseId) =>
    api.get(`/api/projects/${projectId}/test-cases/${caseId}`).then((r) => r.data),
}

export const executionsApi = {
  list: (projectId, caseId) =>
    api
      .get(`/api/projects/${projectId}/test-cases/${caseId}/executions`)
      .then((r) => r.data),
  get: (projectId, caseId, execId) =>
    api
      .get(`/api/projects/${projectId}/test-cases/${caseId}/executions/${execId}`)
      .then((r) => r.data),
}
