import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, MessageSquare, FileText, BookOpen, GitBranch,
  History, Settings, Menu, ChevronLeft, Search, LogOut, Users, Wrench
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/chat', label: 'Chat', icon: MessageSquare },
  { to: '/documents', label: 'Documents', icon: FileText },
  { to: '/knowledge-base', label: 'Knowledge Base', icon: BookOpen },
  { to: '/workflows', label: 'Workflows', icon: GitBranch },
  { to: '/conversations', label: 'Conversations', icon: History },
]

const ADMIN_ITEMS = [
  { to: '/users', label: 'Users', icon: Users },
]

export function Shell() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isAdmin = user?.role === 'admin'
  const displayName = user?.displayName || user?.username || 'User'

  return (
    <div className="app">
      <header className="shell-header">
        <div className="shell-header-left">
          <button className="shell-ghost-btn" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
            {sidebarCollapsed ? <ChevronLeft size={20} /> : <Menu size={20} />}
          </button>
          <div className="shell-brand" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
            <div className="shell-brand-icon">
              <BookOpen size={18} />
            </div>
            <span className="shell-brand-name">Jana-LM</span>
            <span className="shell-brand-badge">Command Center</span>
          </div>
        </div>
        <div className="shell-header-center">
          <div className="shell-search">
            <Search size={16} />
            <input type="text" placeholder="Search sources and conversations..." />
          </div>
        </div>
        <div className="shell-header-right">
          <div className="shell-status">
            <span className="shell-status-dot"></span>
            <span className="shell-status-text">
              {displayName}
            </span>
            {isAdmin && (
              <span style={{
                fontSize: '0.625rem', padding: '1px 6px', borderRadius: 4,
                background: 'rgba(254,110,0,0.1)', color: 'var(--primary)',
                fontWeight: 600, marginLeft: 6, textTransform: 'uppercase',
              }}>
                Admin
              </span>
            )}
          </div>
          <button className="shell-ghost-btn" onClick={handleLogout} title="Logout">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <div className="app-body">
        <aside className={`shell-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
          <div className="sidebar-section">
            <div className="sidebar-section-header">
              <BookOpen size={16} />
              {!sidebarCollapsed && <span>Navigation</span>}
            </div>
          </div>

          <div className="sidebar-sources">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.to
              return (
                <div
                  key={item.to}
                  className={`sidebar-source-item ${isActive ? 'active' : ''}`}
                  onClick={() => navigate(item.to)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="sidebar-source-icon">
                    <Icon size={18} />
                  </div>
                  {!sidebarCollapsed && (
                    <div className="sidebar-source-content">
                      <span className="sidebar-source-title">{item.label}</span>
                    </div>
                  )}
                  {isActive && (
                    <div className={`sidebar-source-check checked`} />
                  )}
                </div>
              )
            })}
          </div>

          {isAdmin && !sidebarCollapsed && (
            <>
              <div className="sidebar-section" style={{ marginTop: 12 }}>
                <div className="sidebar-section-header">
                  <Users size={16} />
                  <span>Administration</span>
                </div>
              </div>
              <div className="sidebar-sources">
                {ADMIN_ITEMS.map((item) => {
                  const Icon = item.icon
                  const isActive = location.pathname === item.to
                  return (
                    <div
                      key={item.to}
                      className={`sidebar-source-item ${isActive ? 'active' : ''}`}
                      onClick={() => navigate(item.to)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="sidebar-source-icon">
                        <Icon size={18} />
                      </div>
                      <div className="sidebar-source-content">
                        <span className="sidebar-source-title">{item.label}</span>
                      </div>
                      {isActive && <div className={`sidebar-source-check checked`} />}
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </aside>

        <main className="workspace" style={{ overflow: 'auto' }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
