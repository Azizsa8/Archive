export interface User {
  id: string
  username: string
  displayName?: string
  role: 'admin' | 'operator' | 'viewer'
}

export interface DashboardStats {
  totalDocuments: number
  conversationsToday: number
  queriesThisWeek: number
  activeSources: number
  recentActivity: ActivityItem[]
  queriesByDay: { date: string; count: number }[]
  systemHealth: SystemHealth
}

export interface ActivityItem {
  id: number
  type: 'document_uploaded' | 'conversation' | 'error' | 'source_added'
  description: string
  timestamp: string
}

export interface SystemHealth {
  postgres: 'healthy' | 'degraded' | 'down'
  n8n: 'healthy' | 'degraded' | 'down'
  waha: 'healthy' | 'degraded' | 'down'
  gemini: 'healthy' | 'degraded' | 'down'
  langflow?: 'healthy' | 'degraded' | 'down'
}

export interface Document {
  id: string
  filename: string
  source_type: string
  status: string
  file_size: number | null
  page_count: number | null
  created_at: string
  updated_at: string
}

export interface Conversation {
  id: string
  session_id: string
  role: 'user' | 'assistant'
  content: string
  tokens: number | null
  created_at: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
}

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  token: string
  user: User
}

export interface SessionInfo {
  id: string
  title: string
  context: any
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface SessionMessage {
  id: string
  session_id: string
  role: 'user' | 'assistant' | 'tool'
  content: string | null
  media_ids: string[]
  tool_calls: any
  metadata: any
  created_at: string
}
