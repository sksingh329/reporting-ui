import { Outlet, Link, NavLink, useMatch, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { projectsApi } from '../api/client'

const NAV_ITEMS = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    path: (id) => `/projects/${id}/dashboard`,
    end: true,
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    key: 'test-reports',
    label: 'Test Reports',
    path: (id) => `/projects/${id}/test-reports`,
    end: false,
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
  },
]


export default function Layout() {
  const navigate = useNavigate()
  const matchSub = useMatch('/projects/:projectId/*')
  const matchExact = useMatch('/projects/:projectId')
  const projectId = (matchSub ?? matchExact)?.params?.projectId

  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: projectsApi.list,
  })

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-gray-200 flex flex-col shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-2 px-5 py-5 border-b border-gray-100">
          <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <span className="font-bold text-gray-900 text-base tracking-tight">Test Reporter</span>
        </div>

        {/* Project selector */}
        <div className="px-4 py-4 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Project</p>
          <select
            value={projectId ?? ''}
            onChange={(e) => {
              if (e.target.value) navigate(`/projects/${e.target.value}/dashboard`)
            }}
            className="w-full text-sm rounded-md border border-gray-200 px-2.5 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
          >
            <option value="">— select project —</option>
            {projects?.map((p) => (
              <option key={p.id} value={String(p.id)}>{p.name}</option>
            ))}
          </select>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV_ITEMS.map((item) =>
            projectId ? (
              <NavLink
                key={item.key}
                to={item.path(projectId)}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`
                }
              >
                {item.icon}
                {item.label}
              </NavLink>
            ) : (
              <span
                key={item.key}
                className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium text-gray-300 cursor-not-allowed select-none"
              >
                {item.icon}
                {item.label}
              </span>
            )
          )}
        </nav>

        {/* Manage projects */}
        <div className="px-4 py-4 border-t border-gray-100">
          <Link
            to="/projects"
            className="text-xs text-gray-500 hover:text-indigo-600 transition-colors"
          >
            + Manage Projects
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 px-8 py-8 overflow-auto min-w-0">
        <Outlet />
      </main>
    </div>
  )
}
