import { useState, useEffect, useMemo } from 'react'
import { Outlet, Link, NavLink, useMatch, useNavigate, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { projectsApi, testCasesApi } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useIsAdmin } from '../context/AuthContext'
import { useSettings } from '../context/SettingsContext'
import { useEnvironment } from '../context/EnvironmentContext'

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
  const location = useLocation()
  const { logout, user } = useAuth()
  const isAdmin = useIsAdmin()
  const { default_project_id } = useSettings()
  const { selectedEnv, setSelectedEnv } = useEnvironment()
  const matchSub = useMatch('/projects/:projectId/*')
  const matchExact = useMatch('/projects/:projectId')
  const projectId = (matchSub ?? matchExact)?.params?.projectId

  // Auto-navigate to default project when user is on a non-project page
  useEffect(() => {
    if (default_project_id && !projectId && location.pathname === '/projects') {
      navigate(`/projects/${default_project_id}/dashboard`, { replace: true })
    }
  }, [default_project_id, projectId, location.pathname, navigate])

  // collapsed = sidebar hidden; pinned = sidebar always visible (persisted in localStorage)
  const [pinned, setPinned] = useState(() => localStorage.getItem('sidebar-pinned') !== 'false')
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('sidebar-pinned') === 'false')
  const [hovered, setHovered] = useState(false)

  const sidebarVisible = pinned || hovered

  function togglePin() {
    const next = !pinned
    setPinned(next)
    setCollapsed(!next)
    localStorage.setItem('sidebar-pinned', String(next))
  }

  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: projectsApi.list,
  })

  // Derive available environments from cached test-cases data (shares query key with pages — no extra calls)
  const { data: testCasesForEnv } = useQuery({
    queryKey: ['test-cases', projectId],
    queryFn: () => testCasesApi.list(projectId),
    enabled: !!projectId,
    staleTime: 30_000,
  })

  const availableEnvs = useMemo(() => {
    if (!testCasesForEnv) return []
    const envSet = new Set(
      testCasesForEnv
        .map((tc) => tc.latest_execution?.environment)
        .filter(Boolean)
    )
    return Array.from(envSet).sort()
  }, [testCasesForEnv])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex relative">

      {/* Collapsed tab — shown only when sidebar is hidden and not hovered */}
      {!sidebarVisible && (
        <div
          className="fixed left-0 top-0 h-full w-2 z-30 group"
          onMouseEnter={() => setHovered(true)}
        >
          {/* Visible trigger strip */}
          <div className="absolute left-0 top-0 h-full w-2 bg-gray-200 hover:bg-indigo-300 dark:bg-gray-700 dark:hover:bg-indigo-700 transition-colors cursor-pointer" />
          {/* Expand icon pill */}
          <button
            onClick={togglePin}
            className="absolute top-5 -right-5 flex items-center justify-center w-6 h-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-r-lg shadow-sm text-gray-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors z-40"
            title="Pin sidebar"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}

      {/* Sidebar */}
      <aside
        className={`bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col shrink-0 transition-all duration-200 overflow-hidden z-20
          ${sidebarVisible ? 'w-56' : 'w-0 border-r-0'}
          ${!pinned && hovered ? 'fixed left-0 top-0 h-full shadow-xl' : 'relative'}
        `}
        onMouseLeave={() => { if (!pinned) setHovered(false) }}
      >
        {/* Logo + pin toggle */}
        <div className="flex items-center justify-between px-4 py-5 border-b border-gray-100 dark:border-gray-700 min-w-[224px]">
          <Link to="/projects" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <svg className="w-5 h-5 text-indigo-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="font-bold text-gray-900 dark:text-white text-base tracking-tight whitespace-nowrap">Test Reporter</span>
          </Link>
          {/* Pin / unpin button */}
          <button
            onClick={togglePin}
            title={pinned ? 'Unpin sidebar' : 'Pin sidebar'}
            className={`p-1 rounded transition-colors ${pinned ? 'text-indigo-500 hover:text-indigo-700' : 'text-gray-300 hover:text-indigo-500'}`}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill={pinned ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </button>
        </div>

        {/* Project selector */}
        <div className="px-4 py-4 border-b border-gray-100 dark:border-gray-700 min-w-[224px]">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Project</p>
          <select
            value={projectId ?? ''}
            onChange={(e) => {
              if (e.target.value) navigate(`/projects/${e.target.value}/dashboard`)
            }}
            className="w-full text-sm rounded-md border border-gray-200 dark:border-gray-600 px-2.5 py-1.5 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
          >
            <option value="">— select project —</option>
            {projects?.map((p) => (
              <option key={p.id} value={String(p.id)}>{p.name}</option>
            ))}
          </select>
        </div>

        {/* Environment filter — only shown when project selected and envs detected */}
        {projectId && availableEnvs.length > 0 && (
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 min-w-[224px]">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Environment</p>
            <select
              value={selectedEnv ?? ''}
              onChange={(e) => setSelectedEnv(e.target.value || null)}
              className="w-full text-sm rounded-md border border-gray-200 dark:border-gray-600 px-2.5 py-1.5 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
            >
              <option value="">All Environments</option>
              {availableEnvs.map((env) => (
                <option key={env} value={env}>{env}</option>
              ))}
            </select>
          </div>
        )}

        {/* Nav items */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 min-w-[224px]">
          {NAV_ITEMS.map((item) =>
            projectId ? (
              <NavLink
                key={item.key}
                to={{ pathname: item.path(projectId), search: selectedEnv ? `?env=${encodeURIComponent(selectedEnv)}` : '' }}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100'
                  }`
                }
              >
                {item.icon}
                {item.label}
              </NavLink>
            ) : (
              <span
                key={item.key}
                className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium text-gray-300 dark:text-gray-600 cursor-not-allowed select-none"
              >
                {item.icon}
                {item.label}
              </span>
            )
          )}
        </nav>

        {/* Bottom actions */}
        <div className="px-4 py-4 border-t border-gray-100 dark:border-gray-700 space-y-2 min-w-[224px]">
          {isAdmin && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `text-xs flex items-center gap-1.5 transition-colors ${
                  isActive ? 'text-indigo-600 dark:text-indigo-400 font-medium' : 'text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400'
                }`
              }
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Admin
            </NavLink>
          )}
          <NavLink
            to="/integration"
            className={({ isActive }) =>
              `text-xs flex items-center gap-1.5 transition-colors ${
                isActive ? 'text-indigo-600 dark:text-indigo-400 font-medium' : 'text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400'
              }`
            }
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
            Integration
          </NavLink>
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `text-xs flex items-center gap-1.5 transition-colors ${
                isActive ? 'text-indigo-600 dark:text-indigo-400 font-medium' : 'text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400'
              }`
            }
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Settings
          </NavLink>
          {user?.username && (
            <NavLink
              to="/profile"
              className={({ isActive }) =>
                `flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors cursor-pointer group ${
                  isActive
                    ? 'bg-indigo-50 dark:bg-indigo-900/40 ring-1 ring-indigo-200 dark:ring-indigo-700'
                    : 'bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 hover:ring-1 hover:ring-gray-200 dark:hover:ring-gray-600'
                }`
              }
            >
              <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/60 flex items-center justify-center shrink-0">
                <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-300 uppercase">
                  {user.username[0]}
                </span>
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-xs font-medium text-gray-700 dark:text-gray-200 truncate" title={user.username}>
                  {user.username}
                </span>
                {user.role && (
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 capitalize">{user.role}</span>
                )}
              </div>
              <svg className="w-3 h-3 text-gray-300 dark:text-gray-600 group-hover:text-gray-400 dark:group-hover:text-gray-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </NavLink>
          )}
          <div className="flex items-center justify-between">
            <button
              onClick={logout}
              className="ml-auto text-xs text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors flex items-center gap-1"
              title="Sign out"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
              </svg>
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className={`flex-1 px-8 py-8 overflow-auto min-w-0 transition-all duration-200 ${!sidebarVisible ? 'pl-6' : ''}`}>
        <Outlet />
      </main>
    </div>
  )
}
