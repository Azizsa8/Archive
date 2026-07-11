import { useDashboardStats } from '../hooks/useDashboard'
import { KPIGrid } from '../components/KPIGrid'
import { ErrorBoundary } from '../components/ErrorBoundary'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import {
  Activity, Clock, FileText, MessageSquare, AlertCircle, CheckCircle, XCircle,
} from 'lucide-react'

function HealthBadge({ status }: { status: string }) {
  const colors: Record<string, { bg: string; fg: string; icon: typeof CheckCircle }> = {
    healthy: { bg: '#dcfce7', fg: '#016630', icon: CheckCircle },
    degraded: { bg: '#fef9c2', fg: '#874b00', icon: AlertCircle },
    down: { bg: '#fee2e2', fg: '#b91c1c', icon: XCircle },
  }
  const c = colors[status] || colors.down
  const Icon = c.icon

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '4px 12px',
      borderRadius: '9999px',
      fontSize: '0.75rem',
      fontWeight: 600,
      background: c.bg,
      color: c.fg,
      textTransform: 'capitalize',
    }}>
      <Icon size={14} />
      {status}
    </span>
  )
}

function ActivityFeed({ activities }: { activities: any[] }) {
  if (activities.length === 0) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', color: 'var(--on-surface-muted)', fontSize: '0.875rem' }}>
        No recent activity
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {activities.map((a, i) => (
        <div key={i} style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
          padding: '12px',
          borderRadius: '8px',
          transition: 'background 150ms',
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            background: a.type === 'document_uploaded'
              ? 'rgba(254, 110, 0, 0.10)'
              : 'rgba(48, 128, 255, 0.10)',
            color: a.type === 'document_uploaded' ? 'var(--primary)' : '#3080ff',
          }}>
            {a.type === 'document_uploaded' ? <FileText size={16} /> : <MessageSquare size={16} />}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              fontSize: '0.875rem',
              color: 'var(--on-surface)',
              fontWeight: 500,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {a.description}
            </p>
            <p style={{
              fontSize: '0.75rem',
              color: 'var(--on-surface-muted)',
              marginTop: '2px',
            }}>
              {new Date(a.timestamp).toLocaleString('en-US', {
                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
              })}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

function DashboardInner() {
  const { data, isLoading, error } = useDashboardStats()

  if (isLoading) {
    return (
      <div style={{ padding: '32px 40px', color: 'var(--on-surface-muted)' }}>
        Loading dashboard...
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: '32px 40px', color: 'var(--danger)' }}>
        Failed to load dashboard: {error.message}
      </div>
    )
  }

  if (!data) return null

  return (
    <div style={{ padding: '32px 40px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{
          fontSize: '1.5rem',
          fontWeight: 700,
          color: 'var(--on-surface)',
          marginBottom: '4px',
        }}>
          Dashboard
        </h1>
        <p style={{ color: 'var(--on-surface-muted)', fontSize: '0.875rem' }}>
          System overview and key metrics
        </p>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <KPIGrid
          totalDocuments={data.totalDocuments}
          conversationsToday={data.conversationsToday}
          queriesThisWeek={data.queriesThisWeek}
          activeSources={data.activeSources}
        />
      </div>

      {/* Charts + Health Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 320px',
        gap: '16px',
        marginBottom: '24px',
      }}>
        {/* Queries chart */}
        <div style={{
          background: 'var(--surface-elevated)',
          border: '1px solid var(--outline)',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: 'var(--shadow-subtle)',
        }}>
          <h3 style={{
            fontSize: '0.875rem',
            fontWeight: 600,
            color: 'var(--on-surface)',
            marginBottom: '16px',
          }}>
            Queries (Last 7 Days)
          </h3>
          {data.queriesByDay.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={data.queriesByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--outline)" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: 'var(--on-surface-muted)' }}
                  tickFormatter={(d: string) => {
                    const date = new Date(d)
                    return date.toLocaleDateString('en-US', { weekday: 'short' })
                  }}
                />
                <YAxis tick={{ fontSize: 12, fill: 'var(--on-surface-muted)' }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--surface-elevated)',
                    border: '1px solid var(--outline)',
                    borderRadius: '8px',
                    fontSize: '0.8125rem',
                  }}
                />
                <Bar dataKey="count" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{
              height: 240,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--on-surface-muted)',
              fontSize: '0.875rem',
            }}>
              No data yet
            </div>
          )}
        </div>

        {/* System Health */}
        <div style={{
          background: 'var(--surface-elevated)',
          border: '1px solid var(--outline)',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: 'var(--shadow-subtle)',
        }}>
          <h3 style={{
            fontSize: '0.875rem',
            fontWeight: 600,
            color: 'var(--on-surface)',
            marginBottom: '16px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={16} />
              System Health
            </div>
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {Object.entries(data.systemHealth).map(([service, status]) => (
              <div key={service} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <span style={{
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: 'var(--on-surface)',
                  textTransform: 'capitalize',
                }}>
                  {service}
                </span>
                <HealthBadge status={status} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div style={{
        background: 'var(--surface-elevated)',
        border: '1px solid var(--outline)',
        borderRadius: '12px',
        boxShadow: 'var(--shadow-subtle)',
      }}>
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--outline)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <Clock size={16} style={{ color: 'var(--on-surface-muted)' }} />
          <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--on-surface)' }}>
            Recent Activity
          </h3>
        </div>
        <ActivityFeed activities={data.recentActivity} />
      </div>
    </div>
  )
}

export function Dashboard() {
  return (
    <ErrorBoundary>
      <DashboardInner />
    </ErrorBoundary>
  )
}
