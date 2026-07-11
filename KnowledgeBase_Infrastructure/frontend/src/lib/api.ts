import type { ToolInfo } from '../types/auth'

const API_BASE = '/api'

function getToken(): string | null {
  return localStorage.getItem('jana_token')
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  })

  if (res.status === 401) {
    localStorage.removeItem('jana_token')
    localStorage.removeItem('jana_user')
    window.location.href = '/login'
    throw new Error('Unauthorized')
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(err.error || `HTTP ${res.status}`)
  }

  return res.json()
}

export const api = {
  login: (username: string, password: string) =>
    request<{ token: string; user: { id: string; username: string; displayName?: string; role: string } }>(
      '/auth/login',
      { method: 'POST', body: JSON.stringify({ username, password }) }
    ),

  dashboard: {
    stats: () => request<import('../types/dashboard').DashboardStats>('/dashboard/stats'),
  },

  documents: {
    list: (params?: { page?: number; limit?: number; search?: string }) => {
      const q = new URLSearchParams()
      if (params?.page) q.set('page', String(params.page))
      if (params?.limit) q.set('limit', String(params.limit))
      if (params?.search) q.set('search', params.search)
      return request<import('../types/document').DocumentListResponse>(`/documents?${q}`)
    },
    delete: (id: string) =>
      request<{ success: boolean }>(`/documents/${id}`, { method: 'DELETE' }),
  },

  conversations: {
    list: (params?: { page?: number; limit?: number }) => {
      const q = new URLSearchParams()
      if (params?.page) q.set('page', String(params.page))
      if (params?.limit) q.set('limit', String(params.limit))
      return request<import('../types/conversation').ConversationListResponse>(`/conversations?${q}`)
    },
  },

  system: {
    health: () => request<{ status: string; services: Record<string, string> }>('/system/health'),
  },

  media: {
    upload: async (file: File, sessionId: string, description?: string) => {
      const token = getToken()
      const formData = new FormData()
      formData.append('file', file)
      formData.append('session_id', sessionId)
      if (description) formData.append('description', description)

      const headers: Record<string, string> = {}
      if (token) headers['Authorization'] = `Bearer ${token}`

      const res = await fetch(`${API_BASE}/media/upload`, {
        method: 'POST',
        headers,
        body: formData,
      })

      if (res.status === 401) {
        localStorage.removeItem('jana_token')
        localStorage.removeItem('jana_user')
        window.location.href = '/login'
        throw new Error('Unauthorized')
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Upload failed' }))
        throw new Error(err.error || `HTTP ${res.status}`)
      }

      return res.json() as Promise<{
        id: string
        name: string
        type: string
        size: number
        url: string
        sessionId: string
        createdAt: string
      }>
    },
    list: (params?: { page?: number; limit?: number }) => {
      const q = new URLSearchParams()
      if (params?.page) q.set('page', String(params.page))
      if (params?.limit) q.set('limit', String(params.limit))
      return request<{ data: any[]; total: number; page: number; limit: number }>(`/media?${q}`)
    },
  },

  sessions: {
    list: () => request<{ data: import('../types/auth').SessionInfo[] }>('/sessions'),
    create: (title?: string) =>
      request<import('../types/auth').SessionInfo>('/sessions', {
        method: 'POST',
        body: JSON.stringify({ title }),
      }),
    get: (id: string) =>
      request<{ session: import('../types/auth').SessionInfo; messages: import('../types/auth').SessionMessage[] }>(
        `/sessions/${id}`
      ),
    delete: (id: string) =>
      request<{ success: boolean }>(`/sessions/${id}`, { method: 'DELETE' }),
    update: (id: string, data: { title?: string; context?: any }) =>
      request<import('../types/auth').SessionInfo>(`/sessions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    sendMessage: (sessionId: string, content: string, mediaIds?: string[]) =>
      request<{
        userMessage: import('../types/auth').SessionMessage
        status: string
      }>(`/sessions/${sessionId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content, mediaIds }),
      }),
  },

  tools: {
    list: () => request<{ data: ToolInfo[] }>('/tools'),
    execute: (id: string, input: any) =>
      request<{ success: boolean; output: string; error: string | null }>(`/tools/${id}/execute`, {
        method: 'POST',
        body: JSON.stringify({ input }),
      }),
  },

  users: {
    list: () => request<{ data: any[] }>('/users'),
    create: (data: { username: string; password: string; displayName?: string; role?: string }) =>
      request<any>('/users', { method: 'POST', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<{ success: boolean }>(`/users/${id}`, { method: 'DELETE' }),
  },
}
