export interface User {
  id: string
  username: string
  displayName?: string
  role: 'admin' | 'operator' | 'viewer'
}

export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
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

export interface ToolInfo {
  id: string
  name: string
  description: string
  icon: string
  tool_type: string
  config: any
  is_active: boolean
}
