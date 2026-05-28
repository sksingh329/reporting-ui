import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi, projectsApi, serviceTokensApi } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { formatDateTime, relativeTime } from '../utils/dateUtils'
import LoadingSpinner from '../components/LoadingSpinner'

// ── Shared UI helpers ────────────────────────────────────────────────────────

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium rounded-t-md border-b-2 transition-colors ${
        active
          ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
          : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
      }`}
    >
      {children}
    </button>
  )
}

function RoleBadge({ role }) {
  const colours =
    role === 'admin'
      ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300'
      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${colours}`}>
      {role ?? 'user'}
    </span>
  )
}

function ActiveDot({ active }) {
  return (
    <span className={`inline-block w-2 h-2 rounded-full ${active ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`} title={active ? 'Active' : 'Inactive'} />
  )
}

function InlineError({ error, fallback = 'Something went wrong.' }) {
  return (
    <p className="text-sm text-red-600 dark:text-red-400 mt-1">
      {error?.response?.data?.detail ?? fallback}
    </p>
  )
}

const inputCls =
  'w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400'

const tableHeaderCls = 'px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 text-left'
const tableCellCls   = 'px-4 py-3 text-sm'

// ── Users Tab ────────────────────────────────────────────────────────────────

function UsersTab({ currentUserId }) {
  const queryClient = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState({ username: '', email: '', password: '', role: 'user' })
  const [createError, setCreateError] = useState('')
  const [expandedReset, setExpandedReset] = useState(null) // user id with reset row open
  const [resetPw, setResetPw] = useState('')
  const [resetError, setResetError] = useState('')
  const [resetSuccess, setResetSuccess] = useState(null) // user id that just succeeded
  const [deleteConfirm, setDeleteConfirm] = useState(null) // user id

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: adminApi.listUsers,
  })

  // Exclude the logged-in admin's own account
  const otherUsers = users.filter((u) => u.id !== currentUserId)

  const createMutation = useMutation({
    mutationFn: () => adminApi.createUser(createForm),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      setCreateForm({ username: '', email: '', password: '', role: 'user' })
      setShowCreate(false)
      setCreateError('')
    },
    onError: (e) => setCreateError(e?.response?.data?.detail ?? 'Failed to create user.'),
  })

  const resetMutation = useMutation({
    mutationFn: (userId) => adminApi.resetPassword(userId, resetPw),
    onSuccess: (_, userId) => {
      setExpandedReset(null)
      setResetPw('')
      setResetError('')
      setResetSuccess(userId)
      setTimeout(() => setResetSuccess(null), 3000)
    },
    onError: (e) => setResetError(e?.response?.data?.detail ?? 'Failed to reset password.'),
  })

  const deleteMutation = useMutation({
    mutationFn: (userId) => adminApi.deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      setDeleteConfirm(null)
    },
  })

  function openReset(userId) {
    setExpandedReset(userId)
    setResetPw('')
    setResetError('')
    setDeleteConfirm(null)
  }

  return (
    <div className="space-y-4">
      {/* Create form toggle */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400 dark:text-gray-500">{otherUsers.length} user{otherUsers.length !== 1 ? 's' : ''}</p>
        <button
          onClick={() => { setShowCreate((v) => !v); setCreateError('') }}
          className="rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 transition-colors"
        >
          {showCreate ? 'Cancel' : '+ Create User'}
        </button>
      </div>

      {showCreate && (
        <div className="bg-gray-50 dark:bg-gray-700/40 rounded-xl border border-gray-200 dark:border-gray-700 px-5 py-4 space-y-3">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">New User</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Username</label>
              <input type="text" value={createForm.username} onChange={(e) => setCreateForm((p) => ({ ...p, username: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Email</label>
              <input type="email" value={createForm.email} onChange={(e) => setCreateForm((p) => ({ ...p, email: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Password</label>
              <input type="password" value={createForm.password} onChange={(e) => setCreateForm((p) => ({ ...p, password: e.target.value }))} autoComplete="new-password" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Role</label>
              <select value={createForm.role} onChange={(e) => setCreateForm((p) => ({ ...p, role: e.target.value }))} className={inputCls}>
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          {createError && <p className="text-sm text-red-600 dark:text-red-400">{createError}</p>}
          <div className="flex justify-end">
            <button
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending || !createForm.username || !createForm.email || !createForm.password}
              className="rounded-md bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 transition-colors"
            >
              {createMutation.isPending ? 'Creating…' : 'Create User'}
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="py-6"><LoadingSpinner /></div>
      ) : otherUsers.length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-gray-500 py-4">No other users found.</p>
      ) : (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700/50">
                <th className={tableHeaderCls}>Username</th>
                <th className={tableHeaderCls}>Email</th>
                <th className={tableHeaderCls}>Role</th>
                <th className={tableHeaderCls}>Status</th>
                <th className={tableHeaderCls}>Created</th>
                <th className={tableHeaderCls}></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {otherUsers.map((u) => (
                <>
                  <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className={`${tableCellCls} font-medium text-gray-800 dark:text-gray-200`}>{u.username}</td>
                    <td className={`${tableCellCls} text-gray-500 dark:text-gray-400`}>{u.email}</td>
                    <td className={tableCellCls}><RoleBadge role={u.role} /></td>
                    <td className={tableCellCls}>
                      <span className="flex items-center gap-1.5">
                        <ActiveDot active={u.is_active} />
                        <span className="text-xs text-gray-500 dark:text-gray-400">{u.is_active ? 'Active' : 'Inactive'}</span>
                      </span>
                    </td>
                    <td className={`${tableCellCls} text-xs text-gray-500 dark:text-gray-400`}>{formatDateTime(u.created_at)}</td>
                    <td className={`${tableCellCls} text-right`}>
                      {resetSuccess === u.id ? (
                        <span className="text-xs text-green-600 dark:text-green-400 font-medium">✓ Password reset</span>
                      ) : (
                        <span className="inline-flex items-center gap-3">
                          {deleteConfirm === u.id ? (
                            <>
                              <span className="text-xs text-gray-500 dark:text-gray-400">Delete?</span>
                              <button onClick={() => deleteMutation.mutate(u.id)} disabled={deleteMutation.isPending} className="text-xs font-semibold text-red-600 hover:text-red-700 dark:text-red-400 disabled:opacity-50">Yes</button>
                              <button onClick={() => setDeleteConfirm(null)} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">Cancel</button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => expandedReset === u.id ? setExpandedReset(null) : openReset(u.id)}
                                className="text-xs font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
                              >
                                Reset Password
                              </button>
                              <button
                                onClick={() => { setDeleteConfirm(u.id); setExpandedReset(null) }}
                                className="text-xs font-medium text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </span>
                      )}
                    </td>
                  </tr>
                  {expandedReset === u.id && (
                    <tr key={`${u.id}-reset`} className="bg-indigo-50 dark:bg-indigo-900/20">
                      <td colSpan={6} className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-medium text-gray-600 dark:text-gray-400 shrink-0">New password for <strong>{u.username}</strong>:</span>
                          <input
                            type="password"
                            value={resetPw}
                            onChange={(e) => setResetPw(e.target.value)}
                            autoComplete="new-password"
                            placeholder="Enter new password"
                            className="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-400 w-64"
                          />
                          <button
                            onClick={() => resetMutation.mutate(u.id)}
                            disabled={resetMutation.isPending || !resetPw}
                            className="rounded-md bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold px-3 py-1.5 transition-colors"
                          >
                            {resetMutation.isPending ? 'Resetting…' : 'Reset'}
                          </button>
                          <button onClick={() => setExpandedReset(null)} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">Cancel</button>
                          {resetError && <span className="text-xs text-red-600 dark:text-red-400">{resetError}</span>}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── Projects Tab ─────────────────────────────────────────────────────────────

function ProjectsTab() {
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [createError, setCreateError] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: projectsApi.list,
  })

  const createMutation = useMutation({
    mutationFn: () => projectsApi.create(name.trim()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      setName('')
      setCreateError('')
    },
    onError: (e) => setCreateError(e?.response?.data?.detail ?? 'Failed to create project.'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => projectsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      setDeleteConfirm(null)
    },
  })

  return (
    <div className="space-y-4">
      {/* Inline create form */}
      <form
        onSubmit={(e) => { e.preventDefault(); if (name.trim()) createMutation.mutate() }}
        className="flex gap-3 items-start"
      >
        <div className="flex-1 max-w-sm">
          <input
            type="text"
            value={name}
            onChange={(e) => { setName(e.target.value); setCreateError('') }}
            placeholder="New project name"
            className={inputCls}
          />
          {createError && <p className="text-xs text-red-600 dark:text-red-400 mt-1">{createError}</p>}
        </div>
        <button
          type="submit"
          disabled={createMutation.isPending || !name.trim()}
          className="rounded-md bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 transition-colors"
        >
          {createMutation.isPending ? 'Creating…' : '+ Create Project'}
        </button>
      </form>

      {isLoading ? (
        <div className="py-6"><LoadingSpinner /></div>
      ) : projects.length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-gray-500 py-4">No projects yet.</p>
      ) : (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700/50">
                <th className={tableHeaderCls}>Name</th>
                <th className={tableHeaderCls}>Created</th>
                <th className={tableHeaderCls}></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {projects.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                  <td className={`${tableCellCls} font-medium text-gray-800 dark:text-gray-200`}>{p.name}</td>
                  <td className={`${tableCellCls} text-xs text-gray-500 dark:text-gray-400`}>{formatDateTime(p.created_at)}</td>
                  <td className={`${tableCellCls} text-right`}>
                    {deleteConfirm === p.id ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400">Delete?</span>
                        <button onClick={() => deleteMutation.mutate(p.id)} disabled={deleteMutation.isPending} className="text-xs font-semibold text-red-600 hover:text-red-700 dark:text-red-400 disabled:opacity-50">Yes</button>
                        <button onClick={() => setDeleteConfirm(null)} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">Cancel</button>
                      </span>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirm(p.id)}
                        className="text-xs font-medium text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── Service Tokens Tab ────────────────────────────────────────────────────────

function ServiceTokensTab({ currentUserId }) {
  const queryClient = useQueryClient()
  const [revokeConfirm, setRevokeConfirm] = useState(null)

  const { data: allTokens = [], isLoading: tokensLoading } = useQuery({
    queryKey: ['service-tokens'],
    queryFn: () => serviceTokensApi.list(),
  })

  const { data: users = [] } = useQuery({
    queryKey: ['admin-users'],
    queryFn: adminApi.listUsers,
  })

  // Build owner lookup: { [userId]: username }
  const usersMap = Object.fromEntries(users.map((u) => [u.id, u.username]))

  // Exclude admin's own tokens (those are managed on the Profile page)
  const tokens = allTokens.filter((t) => t.owner_id !== currentUserId)

  const revokeMutation = useMutation({
    mutationFn: (id) => serviceTokensApi.revoke(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-tokens'] })
      setRevokeConfirm(null)
    },
  })

  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-400 dark:text-gray-500">
        Showing tokens for all users except your own. Manage your tokens from your{' '}
        <Link to="/profile" className="text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-300 underline">Profile</Link>.
      </p>

      {tokensLoading ? (
        <div className="py-6"><LoadingSpinner /></div>
      ) : tokens.length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-gray-500 py-4">No service tokens from other users.</p>
      ) : (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700/50">
                <th className={tableHeaderCls}>Name</th>
                <th className={tableHeaderCls}>Owner</th>
                <th className={tableHeaderCls}>Role</th>
                <th className={tableHeaderCls}>Status</th>
                <th className={tableHeaderCls}>Created</th>
                <th className={tableHeaderCls}>Last used</th>
                <th className={tableHeaderCls}>Expires</th>
                <th className={tableHeaderCls}></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {tokens.map((t) => (
                <tr key={t.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors ${!t.is_active ? 'opacity-50' : ''}`}>
                  <td className={`${tableCellCls} font-medium text-gray-800 dark:text-gray-200`}>
                    <div className="flex items-center gap-2">
                      {t.name}
                      {!t.is_active && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">revoked</span>
                      )}
                    </div>
                  </td>
                  <td className={`${tableCellCls} text-gray-500 dark:text-gray-400`}>
                    {t.owner_id != null ? (usersMap[t.owner_id] ?? `#${t.owner_id}`) : '—'}
                  </td>
                  <td className={tableCellCls}><RoleBadge role={t.role} /></td>
                  <td className={tableCellCls}><ActiveDot active={t.is_active} /></td>
                  <td className={`${tableCellCls} text-xs text-gray-500 dark:text-gray-400`}>{formatDateTime(t.created_at)}</td>
                  <td className={`${tableCellCls} text-xs text-gray-500 dark:text-gray-400`}>{t.last_used_at ? relativeTime(t.last_used_at) : '—'}</td>
                  <td className={`${tableCellCls} text-xs text-gray-500 dark:text-gray-400`}>{t.expires_at ? formatDateTime(t.expires_at) : 'Never'}</td>
                  <td className={`${tableCellCls} text-right`}>
                    {t.is_active && (
                      revokeConfirm === t.id ? (
                        <span className="inline-flex items-center gap-2">
                          <span className="text-xs text-gray-500 dark:text-gray-400">Revoke?</span>
                          <button onClick={() => revokeMutation.mutate(t.id)} disabled={revokeMutation.isPending} className="text-xs font-semibold text-red-600 hover:text-red-700 dark:text-red-400 disabled:opacity-50">Yes</button>
                          <button onClick={() => setRevokeConfirm(null)} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">Cancel</button>
                        </span>
                      ) : (
                        <button onClick={() => setRevokeConfirm(t.id)} className="text-xs font-medium text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors">
                          Revoke
                        </button>
                      )
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

const TABS = [
  { key: 'users', label: 'Users' },
  { key: 'projects', label: 'Projects' },
  { key: 'tokens', label: 'Service Tokens' },
]

export default function AdminPage() {
  const { user } = useAuth()
  const [tab, setTab] = useState('users')

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <nav className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
          <Link to="/projects" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
            Projects
          </Link>
          <span>/</span>
          <span className="text-gray-700 dark:text-gray-300 font-medium">Admin</span>
        </nav>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Admin</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage users, projects, and service tokens.</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6 flex gap-1">
        {TABS.map((t) => (
          <TabButton key={t.key} active={tab === t.key} onClick={() => setTab(t.key)}>
            {t.label}
          </TabButton>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'users'    && <UsersTab currentUserId={user?.id} />}
      {tab === 'projects' && <ProjectsTab />}
      {tab === 'tokens'   && <ServiceTokensTab currentUserId={user?.id} />}
    </div>
  )
}
