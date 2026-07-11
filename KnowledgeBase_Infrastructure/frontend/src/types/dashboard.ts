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
}
