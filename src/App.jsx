import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useParams } from 'react-router-dom'
import { useEffect } from 'react'
import Layout from './components/Layout'
import ProjectsPage from './pages/ProjectsPage'
import DashboardPage from './pages/DashboardPage'
import TestCasesPage from './pages/TestCasesPage'
import ExecutionsPage from './pages/ExecutionsPage'
import TestHistoryPage from './pages/TestHistoryPage'
import LoginPage from './pages/LoginPage'
import { useAuth } from './context/AuthContext'

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

export default function App() {
  const { logout } = useAuth()

  // Listen for the axios interceptor's forced-logout event
  useEffect(() => {
    const handler = () => logout()
    window.addEventListener('auth:logout', handler)
    return () => window.removeEventListener('auth:logout', handler)
  }, [logout])

  return (
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
        <Route path="/projects/:projectId/history" element={<TestHistoryPage />} />
      </Route>
    </Routes>
  )
}
