import axios from 'axios'

// In development, Vite proxies /api/* to http://localhost:8000 (see vite.config.js).
// In production, nginx proxies /api/* to the backend service (see nginx.conf).
// Set VITE_API_BASE_URL in .env only if you need to hit a different origin directly.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  withCredentials: true, // send httpOnly refresh_token cookie on every request
})

// ── In-memory access token ────────────────────────────────────────────────
// Called by AuthContext whenever the token changes.
let _accessToken = null
export function setAccessToken(token) {
  _accessToken = token
}

// ── Request interceptor — attach Bearer token ─────────────────────────────
api.interceptors.request.use((config) => {
  if (_accessToken) {
    config.headers = config.headers ?? {}
    config.headers['Authorization'] = `Bearer ${_accessToken}`
  }
  return config
})

// ── Response interceptor — silent token refresh on 401 ───────────────────
let _refreshPromise = null // de-duplicate concurrent refresh calls

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    const status = error.response?.status

    // Only attempt refresh once per request; skip auth endpoints to avoid loops
    if (
      status === 401 &&
      !original._retried &&
      !original.url?.includes('/api/auth/')
    ) {
      original._retried = true
      try {
        // If another request already triggered a refresh, reuse that promise
        if (!_refreshPromise) {
          _refreshPromise = axios
            .post(
              `${import.meta.env.VITE_API_BASE_URL || ''}/api/auth/refresh`,
              null,
              { withCredentials: true }
            )
            .finally(() => { _refreshPromise = null })
        }
        const { data } = await _refreshPromise
        setAccessToken(data.access_token)
        original.headers['Authorization'] = `Bearer ${data.access_token}`
        return api(original) // retry original request with new token
      } catch {
        // Refresh failed — clear token and let the app redirect to login
        setAccessToken(null)
        window.dispatchEvent(new CustomEvent('auth:logout'))
        return Promise.reject(error)
      }
    }
    return Promise.reject(error)
  }
)

// ── Auth API ──────────────────────────────────────────────────────────────
export const authApi = {
  login: (username, password) =>
    axios
      .post(
        `${import.meta.env.VITE_API_BASE_URL || ''}/api/auth/login`,
        { username, password },
        { withCredentials: true }
      )
      .then((r) => r.data),

  refresh: () =>
    axios
      .post(
        `${import.meta.env.VITE_API_BASE_URL || ''}/api/auth/refresh`,
        null,
        { withCredentials: true }
      )
      .then((r) => r.data),

  logout: () =>
    axios
      .post(
        `${import.meta.env.VITE_API_BASE_URL || ''}/api/auth/logout`,
        null,
        { withCredentials: true }
      )
      .then((r) => r.data),

  me: () => api.get('/api/users/me').then((r) => r.data),
}

export const projectsApi = {
  list: () => api.get('/api/projects').then((r) => r.data),
  get: (id) => api.get(`/api/projects/${id}`).then((r) => r.data),
  create: (name) => api.post('/api/projects', { name }).then((r) => r.data),
  delete: (id) => api.delete(`/api/projects/${id}`),
}

export const adminApi = {
  listUsers: () => api.get('/api/users').then((r) => r.data),
  createUser: (payload) => api.post('/api/users', payload).then((r) => r.data),
  deleteUser: (userId) => api.delete(`/api/users/${userId}`),
  resetPassword: (userId, new_password) =>
    api.post(`/api/users/${userId}/reset-password`, { new_password }),
}

export const testCasesApi = {
  list: (projectId, environment = null) =>
    api
      .get(`/api/projects/${projectId}/test-cases`, {
        params: environment ? { environment } : undefined,
      })
      .then((r) => r.data),
  get: (projectId, caseId) =>
    api.get(`/api/projects/${projectId}/test-cases/${caseId}`).then((r) => r.data),
}

export const executionsApi = {
  list: (projectId, caseId, environment = null) =>
    api
      .get(`/api/projects/${projectId}/test-cases/${caseId}/executions`, {
        params: environment ? { environment } : undefined,
      })
      .then((r) => r.data),
  get: (projectId, caseId, execId) =>
    api
      .get(`/api/projects/${projectId}/test-cases/${caseId}/executions/${execId}`)
      .then((r) => r.data),
}

export const userSettingsApi = {
  get: () => api.get('/api/users/settings').then((r) => r.data),
  update: (payload) => api.put('/api/users/settings', payload).then((r) => r.data),
}

export const usersApi = {
  changePassword: (old_password, new_password) =>
    api.post('/api/users/me/password', { old_password, new_password }),
}

export const serviceTokensApi = {
  list: (includeInactive = false) =>
    api.get('/api/service-tokens', { params: { include_inactive: includeInactive } }).then((r) => r.data),
  create: (name, expires_at = null) =>
    api.post('/api/service-tokens', { name, expires_at }).then((r) => r.data),
  revoke: (tokenId) =>
    api.delete(`/api/service-tokens/${tokenId}`),
}
