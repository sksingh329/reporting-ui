import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useParams } from 'react-router-dom'
import { useEffect } from 'react'
import Layout from './components/Layout'
import ProjectsPage from './pages/ProjectsPage'
import DashboardPage from './pages/DashboardPage'
import TestCasesPage from './pages/TestCasesPage'
import ExecutionsPage from './pages/ExecutionsPage'
import LoginPage from './pages/LoginPage'
import SettingsPage from './pages/SettingsPage'
import ProfilePage from './pages/ProfilePage'
import AdminPage from './pages/AdminPage'
import IntegrationPage from './pages/IntegrationPage'
import { useAuth } from './context/AuthContext'
import { EnvironmentProvider } from './context/EnvironmentContext'

function ProjectRedirect() {
  const { projectId } = useParams()
  return <Navigate to={`/projects/${projectId}/dashboard`} replace />
}

// Blocks unauthenticated access — redirects to /login with return path
function RequireAuth({ children }) {
  const { accessToken, ready } = useAuth()
  const location = useLocation()

  if (!ready) {
    // Still checking session via silent refresh — show blank screen briefly
    return null
  }
  if (!accessToken) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  return children
}

// Redirect already-logged-in users away from /login
function RedirectIfAuthed({ children }) {
  const { accessToken, ready } = useAuth()
  if (!ready) return null
  if (accessToken) return <Navigate to="/projects" replace />
  return children
}

// Blocks non-admin access — redirects to /projects silently
function RequireAdmin({ children }) {
  const { user, ready } = useAuth()
  if (!ready) return null
  if (user?.role !== 'admin') return <Navigate to="/projects" replace />
  return children
}

export default function App() {
  const { logout } = useAuth()

  // Listen for the axios interceptor's forced-logout event
  useEffect(() => {
    const handler = () => logout()
    window.addEventListener('auth:logout', handler)
    return () => window.removeEventListener('auth:logout', handler)
  }, [logout])

  return (
    <EnvironmentProvider>
      <Routes>
        <Route
          path="/login"
          element={<RedirectIfAuthed><LoginPage /></RedirectIfAuthed>}
        />
        <Route
          element={
            <RequireAuth>
              <Layout />
            </RequireAuth>
          }
        >
          <Route index element={<Navigate to="/projects" replace />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/projects/:projectId" element={<ProjectRedirect />} />
          <Route path="/projects/:projectId/dashboard" element={<DashboardPage />} />
          <Route path="/projects/:projectId/test-reports" element={<TestCasesPage />} />
          <Route
            path="/projects/:projectId/test-reports/:caseId"
            element={<ExecutionsPage />}
          />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/integration" element={<IntegrationPage />} />
          <Route path="/admin" element={<RequireAdmin><AdminPage /></RequireAdmin>} />
        </Route>
      </Routes>
    </EnvironmentProvider>
  )
}
