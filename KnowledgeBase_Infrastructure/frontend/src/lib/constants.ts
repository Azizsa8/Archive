export const API_BASE = '/api'

export const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: 'LayoutDashboard' },
  { to: '/chat', label: 'Chat', icon: 'MessageSquare' },
  { to: '/documents', label: 'Documents', icon: 'FileText' },
  { to: '/knowledge-base', label: 'Knowledge Base', icon: 'BookOpen' },
  { to: '/workflows', label: 'Workflows', icon: 'GitBranch' },
  { to: '/conversations', label: 'Conversations', icon: 'History' },
  { to: '/settings', label: 'Settings', icon: 'Settings' },
] as const
