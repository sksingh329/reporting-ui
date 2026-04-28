import { Routes, Route, Navigate } from 'react-router-dom'
import { useParams } from 'react-router-dom'
import Layout from './components/Layout'
import ProjectsPage from './pages/ProjectsPage'
import DashboardPage from './pages/DashboardPage'
import TestCasesPage from './pages/TestCasesPage'
import ExecutionsPage from './pages/ExecutionsPage'
import TestHistoryPage from './pages/TestHistoryPage'

function ProjectRedirect() {
  const { projectId } = useParams()
  return <Navigate to={`/projects/${projectId}/dashboard`} replace />
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
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
