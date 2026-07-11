import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import { User } from '../types/auth'
import { getStoredToken, getStoredUser, storeAuth, clearAuth } from '../lib/auth'
import { api } from '../lib/api'

interface AuthContextType {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(getStoredUser)
  const [token, setToken] = useState<string | null>(getStoredToken)

  const isAuthenticated = !!token && !!user

  const login = useCallback(async (username: string, password: string) => {
    const res = await api.login(username, password)
    storeAuth(res.token, res.user as User)
    setToken(res.token)
    setUser(res.user as User)
  }, [])

  const logout = useCallback(() => {
    clearAuth()
    setToken(null)
    setUser(null)
  }, [])

  useEffect(() => {
    if (!token) {
      clearAuth()
      setUser(null)
    }
  }, [token])

  const ctx: AuthContextType = { user, token, isAuthenticated, login, logout }

  return (
    <AuthContext.Provider value={ctx}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
