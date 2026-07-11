export interface Conversation {
  id: string
  session_id: string
  role: 'user' | 'assistant'
  content: string
  tokens: number | null
  created_at: string
}

export interface ConversationListResponse {
  data: Conversation[]
  total: number
  page: number
  limit: number
}
