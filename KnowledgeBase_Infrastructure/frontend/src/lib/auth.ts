import { User } from '../types/auth'

const TOKEN_KEY = 'jana_token'
const USER_KEY = 'jana_user'

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function getStoredUser(): User | null {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as User
  } catch {
    return null
  }
}

export function storeAuth(token: string, user: User): void {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
  localStorage.removeItem('jana_active_session')
}

export function isAuthenticated(): boolean {
  return !!getStoredToken()
}

export function getActiveSessionId(): string | null {
  return localStorage.getItem('jana_active_session')
}

export function setActiveSessionId(id: string): void {
  localStorage.setItem('jana_active_session', id)
}

export function clearActiveSessionId(): void {
  localStorage.removeItem('jana_active_session')
}
