import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { usersApi, serviceTokensApi } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { formatDateTime, relativeTime } from '../utils/dateUtils'

function SectionCard({ title, description, children }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
        {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
      </div>
      <div className="px-6 py-5 space-y-5">{children}</div>
    </div>
  )
}

function ReadOnlyField({ label, hint, value }) {
  return (
    <div className="flex items-start justify-between gap-6">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{label}</p>
        {hint && <p className="text-xs text-gray-400 mt-0.5">{hint}</p>}
      </div>
      <div className="shrink-0 w-64">
        <p className="text-sm text-gray-600 dark:text-gray-300 py-2 px-3 bg-gray-50 dark:bg-gray-700/50 rounded-md border border-gray-200 dark:border-gray-600">
          {value}
        </p>
      </div>
    </div>
  )
}

const inputCls =
  'w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400'

export default function ProfilePage() {
  const { user } = useAuth()

  const [form, setForm] = useState({ old_password: '', new_password: '', confirm_password: '' })
  const [clientError, setClientError] = useState('')
  const [saved, setSaved] = useState(false)

  const mutation = useMutation({
    mutationFn: () => usersApi.changePassword(form.old_password, form.new_password),
    onSuccess: () => {
      setForm({ old_password: '', new_password: '', confirm_password: '' })
      setClientError('')
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    },
  })

  function handleSubmit(e) {
    e.preventDefault()
    setClientError('')
    if (form.new_password !== form.confirm_password) {
      setClientError('New passwords do not match.')
      return
    }
    if (form.new_password.length < 1) {
      setClientError('New password cannot be empty.')
      return
    }
    mutation.mutate()
  }

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <nav className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
          <Link to="/projects" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
            Projects
          </Link>
          <span>/</span>
          <span className="text-gray-700 dark:text-gray-300 font-medium">Profile</span>
        </nav>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Profile</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Your account information.</p>
      </div>

      <div className="space-y-5">

        {/* ── Account ─────────────────────────────────────────────── */}
        <SectionCard title="Account" description="Your profile details">
          <div className="flex items-center gap-4 pb-4 border-b border-gray-100 dark:border-gray-700">
            <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/60 flex items-center justify-center shrink-0">
              <span className="text-lg font-bold text-indigo-600 dark:text-indigo-300 uppercase">
                {user?.username?.[0] ?? '?'}
              </span>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{user?.username}</p>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 capitalize mt-1">
                {user?.role ?? 'user'}
              </span>
            </div>
          </div>

          <ReadOnlyField label="Username" value={user?.username ?? '—'} />
          <ReadOnlyField label="Email" value={user?.email ?? '—'} />
          <ReadOnlyField label="Role" value={user?.role ?? '—'} />
          {user?.created_at && (
            <ReadOnlyField label="Member since" value={formatDateTime(user.created_at)} />
          )}
        </SectionCard>

        {/* ── Change Password ──────────────────────────────────────── */}
        <SectionCard title="Change Password" description="Update your login password">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-start justify-between gap-6">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Current password</p>
              </div>
              <div className="shrink-0 w-64">
                <input
                  type="password"
                  value={form.old_password}
                  onChange={(e) => setForm((p) => ({ ...p, old_password: e.target.value }))}
                  autoComplete="current-password"
                  required
                  className={inputCls}
                />
              </div>
            </div>

            <div className="flex items-start justify-between gap-6">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-200">New password</p>
              </div>
              <div className="shrink-0 w-64">
                <input
                  type="password"
                  value={form.new_password}
                  onChange={(e) => setForm((p) => ({ ...p, new_password: e.target.value }))}
                  autoComplete="new-password"
                  required
                  className={inputCls}
                />
              </div>
            </div>

            <div className="flex items-start justify-between gap-6">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Confirm new password</p>
              </div>
              <div className="shrink-0 w-64">
                <input
                  type="password"
                  value={form.confirm_password}
                  onChange={(e) => setForm((p) => ({ ...p, confirm_password: e.target.value }))}
                  autoComplete="new-password"
                  required
                  className={inputCls}
                />
              </div>
            </div>

            {/* Feedback */}
            {(clientError || mutation.isError) && (
              <p className="text-sm text-red-600 dark:text-red-400">
                {clientError || (mutation.error?.response?.data?.detail ?? 'Failed to update password.')}
              </p>
            )}
            {saved && (
              <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Password updated successfully.
              </p>
            )}

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={mutation.isPending}
                className="rounded-md bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2"
              >
                {mutation.isPending ? 'Updating…' : 'Update Password'}
              </button>
            </div>
          </form>
        </SectionCard>

        {/* ── Service Tokens ───────────────────────────────────────── */}
        <ServiceTokensSection />

      </div>
    </div>
  )
}

function ServiceTokensSection() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [name, setName] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [newToken, setNewToken] = useState(null) // one-time reveal
  const [copied, setCopied] = useState(false)
  const [revokeId, setRevokeId] = useState(null) // confirm state

  const { data: allTokens = [], isLoading } = useQuery({
    queryKey: ['service-tokens'],
    queryFn: () => serviceTokensApi.list(),
  })

  // Admins receive all tokens from the API — filter to only show the current user's own tokens.
  // A dedicated admin page will handle managing tokens for all users.
  const tokens = user?.id != null
    ? allTokens.filter((t) => t.owner_id === user.id)
    : allTokens

  const createMutation = useMutation({
    mutationFn: () => serviceTokensApi.create(name.trim(), expiresAt || null),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['service-tokens'] })
      setNewToken(data.token)
      setName('')
      setExpiresAt('')
    },
  })

  const revokeMutation = useMutation({
    mutationFn: (id) => serviceTokensApi.revoke(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-tokens'] })
      setRevokeId(null)
    },
  })

  function handleCopy() {
    if (!newToken) return
    navigator.clipboard.writeText(newToken)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <SectionCard title="Service Tokens" description="API tokens for programmatic access to the reporting API">
      {/* Create form */}
      <form
        onSubmit={(e) => { e.preventDefault(); if (name.trim()) createMutation.mutate() }}
        className="flex flex-wrap gap-3 items-end"
      >
        <div className="flex-1 min-w-[160px]">
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Token name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. ci-pipeline"
            required
            className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
          />
        </div>
        <div className="w-44">
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Expires (optional)</label>
          <input
            type="date"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            min={new Date().toISOString().slice(0, 10)}
            className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
          />
        </div>
        <button
          type="submit"
          disabled={createMutation.isPending || !name.trim()}
          className="rounded-md bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 transition-colors"
        >
          {createMutation.isPending ? 'Creating…' : '+ Create Token'}
        </button>
      </form>

      {createMutation.isError && (
        <p className="text-sm text-red-600 dark:text-red-400">
          {createMutation.error?.response?.data?.detail ?? 'Failed to create token.'}
        </p>
      )}

      {/* One-time token reveal */}
      {newToken && (
        <div className="rounded-lg border border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 px-4 py-3">
          <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-2">
            Token created — copy it now. It will not be shown again.
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs font-mono bg-white dark:bg-gray-800 border border-amber-200 dark:border-amber-700 rounded px-3 py-2 text-gray-800 dark:text-gray-100 break-all">
              {newToken}
            </code>
            <button
              onClick={handleCopy}
              className="shrink-0 rounded-md border border-amber-300 dark:border-amber-600 bg-white dark:bg-gray-800 text-amber-700 dark:text-amber-400 text-xs font-semibold px-3 py-2 hover:bg-amber-50 dark:hover:bg-amber-900/30 transition-colors"
            >
              {copied ? '✓ Copied' : 'Copy'}
            </button>
            <button
              onClick={() => setNewToken(null)}
              className="shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
              title="Dismiss"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Token list */}
      {isLoading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : tokens.length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-gray-500 py-2">No service tokens yet.</p>
      ) : (
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700/50 text-left">
                <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400">Name</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400">Role</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400">Created</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400">Last used</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400">Expires</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {tokens.map((t) => (
                <tr key={t.id} className={`${!t.is_active ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-800 dark:text-gray-200">{t.name}</span>
                      {!t.is_active && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">revoked</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-medium capitalize text-indigo-600 dark:text-indigo-400">{t.role}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                    {formatDateTime(t.created_at)}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                    {t.last_used_at ? relativeTime(t.last_used_at) : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                    {t.expires_at ? formatDateTime(t.expires_at) : 'Never'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {t.is_active && (
                      revokeId === t.id ? (
                        <span className="inline-flex items-center gap-2">
                          <span className="text-xs text-gray-500 dark:text-gray-400">Revoke?</span>
                          <button
                            onClick={() => revokeMutation.mutate(t.id)}
                            disabled={revokeMutation.isPending}
                            className="text-xs font-semibold text-red-600 hover:text-red-700 dark:text-red-400 disabled:opacity-50"
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => setRevokeId(null)}
                            className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                          >
                            Cancel
                          </button>
                        </span>
                      ) : (
                        <button
                          onClick={() => setRevokeId(t.id)}
                          className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium transition-colors"
                        >
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
    </SectionCard>
  )
}
