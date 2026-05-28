import { createContext, useContext } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useSettings } from './SettingsContext'

const EnvironmentContext = createContext(null)

export function EnvironmentProvider({ children }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const { default_environment } = useSettings()

  const selectedEnv = searchParams.get('env') || default_environment || null

  function setSelectedEnv(env) {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (env) {
          next.set('env', env)
        } else {
          next.delete('env')
        }
        return next
      },
      { replace: true },
    )
  }

  return (
    <EnvironmentContext.Provider value={{ selectedEnv, setSelectedEnv }}>
      {children}
    </EnvironmentContext.Provider>
  )
}

export function useEnvironment() {
  const ctx = useContext(EnvironmentContext)
  if (!ctx) throw new Error('useEnvironment must be used within EnvironmentProvider')
  return ctx
}
