import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { userSettingsApi, projectsApi } from '../api/client'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'

// Common timezones grouped by region
const TIMEZONE_OPTIONS = [
  { label: 'UTC', value: 'UTC' },
  { group: 'Asia' },
  { label: 'Asia/Kolkata (IST, UTC+5:30)', value: 'Asia/Kolkata' },
  { label: 'Asia/Dubai (GST, UTC+4)', value: 'Asia/Dubai' },
  { label: 'Asia/Singapore (SGT, UTC+8)', value: 'Asia/Singapore' },
  { label: 'Asia/Shanghai (CST, UTC+8)', value: 'Asia/Shanghai' },
  { label: 'Asia/Tokyo (JST, UTC+9)', value: 'Asia/Tokyo' },
  { label: 'Asia/Seoul (KST, UTC+9)', value: 'Asia/Seoul' },
  { label: 'Asia/Karachi (PKT, UTC+5)', value: 'Asia/Karachi' },
  { label: 'Asia/Dhaka (BST, UTC+6)', value: 'Asia/Dhaka' },
  { label: 'Asia/Bangkok (ICT, UTC+7)', value: 'Asia/Bangkok' },
  { group: 'Europe' },
  { label: 'Europe/London (GMT/BST)', value: 'Europe/London' },
  { label: 'Europe/Paris (CET, UTC+1/2)', value: 'Europe/Paris' },
  { label: 'Europe/Berlin (CET, UTC+1/2)', value: 'Europe/Berlin' },
  { label: 'Europe/Moscow (MSK, UTC+3)', value: 'Europe/Moscow' },
  { group: 'Americas' },
  { label: 'America/New_York (EST/EDT)', value: 'America/New_York' },
  { label: 'America/Chicago (CST/CDT)', value: 'America/Chicago' },
  { label: 'America/Denver (MST/MDT)', value: 'America/Denver' },
  { label: 'America/Los_Angeles (PST/PDT)', value: 'America/Los_Angeles' },
  { label: 'America/Sao_Paulo (BRT, UTC-3)', value: 'America/Sao_Paulo' },
  { group: 'Pacific / Australia' },
  { label: 'Australia/Sydney (AEST, UTC+10/11)', value: 'Australia/Sydney' },
  { label: 'Pacific/Auckland (NZST, UTC+12/13)', value: 'Pacific/Auckland' },
]

const APP_THEME_OPTIONS = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System default' },
]

const LOG_THEME_OPTIONS = [
  { value: 'terminal', label: 'Terminal (green on dark)' },
  { value: 'dracula', label: 'Dracula (white on purple-dark)' },
  { value: 'light', label: 'Light (dark on white)' },
]

const DURATION_UNIT_OPTIONS = [
  { value: 'ms', label: 'Milliseconds (ms)' },
  { value: 's', label: 'Seconds (s)' },
  { value: 'm', label: 'Minutes (m)' },
]

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

function Field({ label, hint, children }) {
  return (
    <div className="flex items-start justify-between gap-6">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{label}</p>
        {hint && <p className="text-xs text-gray-400 mt-0.5">{hint}</p>}
      </div>
      <div className="shrink-0 w-64">{children}</div>
    </div>
  )
}

const selectCls =
  'w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-400 dark:disabled:text-gray-500'

export default function SettingsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: settings, isLoading, error } = useQuery({
    queryKey: ['user-settings'],
    queryFn: userSettingsApi.get,
  })

  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: projectsApi.list,
  })

  const [form, setForm] = useState(null)
  const [saved, setSaved] = useState(false)

  // Populate form once settings load
  useEffect(() => {
    if (settings && !form) {
      setForm({
        app_theme: settings.app_theme ?? 'light',
        log_popup_theme: settings.log_popup_theme ?? 'terminal',
        timezone: settings.timezone ?? 'UTC',
        default_project_id: settings.default_project_id ?? '',
        duration_unit: settings.duration_unit ?? 'ms',
      })
    }
  }, [settings, form])

  const mutation = useMutation({
    mutationFn: userSettingsApi.update,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-settings'] })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    },
  })

  function set(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function handleSave(e) {
    e.preventDefault()
    const payload = {
      ...form,
      default_project_id: form.default_project_id ? Number(form.default_project_id) : null,
    }
    mutation.mutate(payload)
  }

  function handleReset() {
    if (settings) {
      setForm({
        app_theme: settings.app_theme ?? 'light',
        log_popup_theme: settings.log_popup_theme ?? 'terminal',
        timezone: settings.timezone ?? 'UTC',
        default_project_id: settings.default_project_id ?? '',
        duration_unit: settings.duration_unit ?? 'ms',
      })
    }
  }

  function handleHomeClick() {
    // If default_project_id is set, go to its dashboard
    if (settings?.default_project_id) {
      navigate(`/projects/${settings.default_project_id}/dashboard`)
    } else {
      // Otherwise go to projects list
      navigate('/projects')
    }
  }

  if (isLoading) return <div className="py-10"><LoadingSpinner /></div>
  if (error) return <ErrorMessage error={error} />
  if (!form) return null

  return (
    <div className="max-w-2xl">
      {/* Header with breadcrumb and home button */}
      <div className="flex items-center justify-between mb-6">
        <nav className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
          <Link to="/projects" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
            Projects
          </Link>
          <span>/</span>
          <span className="text-gray-700 dark:text-gray-300 font-medium">Settings</span>
        </nav>
        <button
          onClick={handleHomeClick}
          title="Go to home"
          className="p-2 text-gray-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-3m0 0l7-4 7 4M5 9v10a1 1 0 001 1h12a1 1 0 001-1V9M9 5l3-3m0 0l3 3m-3-3v12" />
          </svg>
        </button>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Personalise your Test Reporter experience.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-5">

        {/* ── Appearance ───────────────────────────────────────────── */}
        <SectionCard title="Appearance" description="Visual theme preferences">
          <Field label="App theme" hint="Controls the overall UI colour scheme">
            <select
              value={form.app_theme}
              onChange={(e) => set('app_theme', e.target.value)}
              className={selectCls}
            >
              {APP_THEME_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </Field>

          <Field label="Log popup theme" hint="Default syntax theme when opening log popups">
            <select
              value={form.log_popup_theme}
              onChange={(e) => set('log_popup_theme', e.target.value)}
              className={selectCls}
            >
              {LOG_THEME_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </Field>
        </SectionCard>

        {/* ── Locale ───────────────────────────────────────────────── */}
        <SectionCard title="Locale" description="Time and display format preferences">
          <Field label="Timezone" hint="All timestamps will be shown in this timezone">
            <select
              value={form.timezone}
              onChange={(e) => set('timezone', e.target.value)}
              className={selectCls}
            >
              {TIMEZONE_OPTIONS.map((o, i) =>
                o.group ? (
                  <optgroup key={`g-${i}`} label={`── ${o.group} ──`} />
                ) : (
                  <option key={o.value} value={o.value}>{o.label}</option>
                )
              )}
            </select>
          </Field>

          <Field label="Duration unit" hint="How execution duration is displayed in tables">
            <select
              value={form.duration_unit}
              onChange={(e) => set('duration_unit', e.target.value)}
              className={selectCls}
            >
              {DURATION_UNIT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </Field>
        </SectionCard>

        {/* ── Defaults ─────────────────────────────────────────────── */}
        <SectionCard title="Defaults" description="Starting state when you first open the app">
          <Field label="Default project" hint="Automatically selected when you open the dashboard">
            <select
              value={form.default_project_id}
              onChange={(e) => set('default_project_id', e.target.value)}
              className={selectCls}
            >
              <option value="">— none —</option>
              {projects?.map((p) => (
                <option key={p.id} value={String(p.id)}>{p.name}</option>
              ))}
            </select>
          </Field>
        </SectionCard>

        {/* ── Actions ──────────────────────────────────────────────── */}
        <div className="flex items-center justify-between pt-1 gap-4">
          <button
            type="button"
            onClick={handleReset}
            disabled={mutation.isPending}
            className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-sm font-semibold px-5 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-40"
          >
            Cancel
          </button>

          <div className="flex items-center gap-3">
            {saved && (
              <span className="text-sm text-green-600 font-medium flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Saved
              </span>
            )}
            {mutation.isError && (
              <span className="text-sm text-red-600">
                {mutation.error?.response?.data?.detail ?? 'Failed to save.'}
              </span>
            )}
            <button
              type="submit"
              disabled={mutation.isPending}
              className="rounded-md bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2"
            >
              {mutation.isPending ? 'Saving…' : 'Save settings'}
            </button>
          </div>
        </div>

      </form>
    </div>
  )
}
