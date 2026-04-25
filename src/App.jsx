import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import ProjectsPage from './pages/ProjectsPage'
import TestCasesPage from './pages/TestCasesPage'
import ExecutionsPage from './pages/ExecutionsPage'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/projects" replace />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/projects/:projectId" element={<TestCasesPage />} />
        <Route
          path="/projects/:projectId/test-cases/:caseId"
          element={<ExecutionsPage />}
        />
      </Route>
    </Routes>
  )
}
