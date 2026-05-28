import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import { authApi, setAccessToken as setAxiosToken } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  // Access token lives only in memory — never written to localStorage/sessionStorage
  const [accessToken, setAccessToken] = useState(null)
  // null = still checking, true = logged in, false = not logged in
  const [ready, setReady] = useState(false)
  const [user, setUser] = useState(null)

  // Keep axios instance in sync whenever token changes
  const syncToken = useCallback((token) => {
    setAccessToken(token)
    setAxiosToken(token)
  }, [])

  // On mount, try a silent refresh to restore session from httpOnly cookie
  useEffect(() => {
    authApi.refresh()
      .then(async ({ access_token }) => {
        syncToken(access_token)
        try {
          const u = await authApi.me()
          setUser(u)
        } catch {
          setUser(null)
        }
      })
      .catch(() => {
        syncToken(null)
      })
      .finally(() => setReady(true))
  }, [syncToken])

  const login = useCallback(async (username, password) => {
    const { access_token } = await authApi.login(username, password)
    syncToken(access_token)
    const u = await authApi.me()
    setUser(u)
  }, [syncToken])

  const logout = useCallback(async () => {
    try { await authApi.logout() } catch { /* ignore */ }
    syncToken(null)
    setUser(null)
  }, [syncToken])

  // Exposed for the axios interceptor to call without triggering re-renders
  const tokenRef = useRef(accessToken)
  useEffect(() => { tokenRef.current = accessToken }, [accessToken])

  const refreshToken = useCallback(async () => {
    const { access_token } = await authApi.refresh()
    syncToken(access_token)
    return access_token
  }, [syncToken])

  return (
    <AuthContext.Provider value={{ accessToken, user, ready, login, logout, refreshToken, tokenRef }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}

// Derived permission helpers — call inside components
// Backend may return user.permissions (string[]) or user.role ('admin'|'viewer'|...)
export function useCanCreateProjects() {
  const { user } = useAuth()
  if (!user) return false
  if (Array.isArray(user.permissions)) {
    return user.permissions.includes('create_projects') ||
           user.permissions.includes('manage_projects')
  }
  // Fall back to role-based check
  return user.role === 'admin' || user.role === 'owner' || user.is_admin === true
}

export function useIsAdmin() {
  const { user } = useAuth()
  return user?.role === 'admin'
}
