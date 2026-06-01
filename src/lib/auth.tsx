import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react'
import type { Role } from '@/lib/rbac'
import { api } from '@/lib/api/client'

/** The authenticated principal carried through the app. */
export interface Session {
  userId: string
  tenantId: string
  tenantName: string
  name: string
  email: string
  role: Role
  /** True until the user sets a real password (first-time login flow). */
  mustSetPassword: boolean
}

const STORAGE_KEY = 'transport.session'

function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Session) : null
  } catch {
    return null
  }
}

interface AuthContextValue {
  session: Session | null
  login: (email: string, password: string) => Promise<Session>
  logout: () => void
  /** Marks the current session expired so guards bounce to login / show the re-auth modal. */
  expire: () => void
  expired: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(loadSession)
  const [expired, setExpired] = useState(false)

  const login = useCallback(async (email: string, password: string) => {
    const next = await api.auth.login(email, password)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    setSession(next)
    setExpired(false)
    return next
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setSession(null)
    setExpired(false)
  }, [])

  const expire = useCallback(() => setExpired(true), [])

  const value = useMemo(
    () => ({ session, login, logout, expire, expired }),
    [session, login, logout, expire, expired],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}
