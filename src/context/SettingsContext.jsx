import { createContext, useContext, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { userSettingsApi } from '../api/client'
import { useAuth } from './AuthContext'
import { setTimezone } from '../utils/dateUtils'

const SettingsContext = createContext(null)

const DEFAULTS = {
  app_theme: 'light',
  log_popup_theme: 'terminal',
  timezone: 'UTC',
  default_project_id: null,
  duration_unit: 'ms',
  default_environment: null,
}

export function SettingsProvider({ children }) {
  const { accessToken } = useAuth()

  const { data: settings } = useQuery({
    queryKey: ['user-settings'],
    queryFn: userSettingsApi.get,
    enabled: !!accessToken,   // only fetch when logged in
    staleTime: 60_000,
  })

  const resolved = { ...DEFAULTS, ...settings }

  // ── Apply app theme to <html> ────────────────────────────────────────────
  useEffect(() => {
    const root = document.documentElement
    const theme = resolved.app_theme

    if (theme === 'dark') {
      root.classList.add('dark')
    } else if (theme === 'light') {
      root.classList.remove('dark')
    } else {
      // 'system'
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      root.classList.toggle('dark', prefersDark)
    }
  }, [resolved.app_theme])

  // ── Apply timezone to dateUtils ──────────────────────────────────────────
  useEffect(() => {
    setTimezone(resolved.timezone)
  }, [resolved.timezone])

  return (
    <SettingsContext.Provider value={resolved}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const ctx = useContext(SettingsContext)
  // Graceful fallback if called outside provider
  return ctx ?? DEFAULTS
}
