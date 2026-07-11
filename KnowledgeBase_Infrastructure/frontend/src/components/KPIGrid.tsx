import { FileText, MessageSquare, Database, Activity } from 'lucide-react'

interface KPIGridProps {
  totalDocuments: number
  conversationsToday: number
  queriesThisWeek: number
  activeSources: number
}

const kpiStyle: React.CSSProperties = {
  background: 'var(--surface-elevated)',
  border: '1px solid var(--outline)',
  borderRadius: '12px',
  padding: '20px 24px',
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
  boxShadow: 'var(--shadow-subtle)',
}

const iconBoxStyle: React.CSSProperties = {
  width: '44px',
  height: '44px',
  borderRadius: '10px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
}

const labelStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: 'var(--on-surface-muted)',
}

const valueStyle: React.CSSProperties = {
  fontSize: '1.75rem',
  fontWeight: 700,
  color: 'var(--on-surface)',
  lineHeight: 1.1,
}

const cards = [
  {
    label: 'Total Documents',
    getValue: (p: KPIGridProps) => p.totalDocuments,
    icon: FileText,
    bg: 'rgba(254, 110, 0, 0.10)',
    color: 'var(--primary)',
  },
  {
    label: 'Conversations Today',
    getValue: (p: KPIGridProps) => p.conversationsToday,
    icon: MessageSquare,
    bg: 'rgba(48, 128, 255, 0.10)',
    color: '#3080ff',
  },
  {
    label: 'Queries This Week',
    getValue: (p: KPIGridProps) => p.queriesThisWeek,
    icon: Activity,
    bg: 'rgba(0, 199, 88, 0.10)',
    color: '#00c758',
  },
  {
    label: 'Active Sources',
    getValue: (p: KPIGridProps) => p.activeSources,
    icon: Database,
    bg: 'rgba(130, 0, 218, 0.10)',
    color: '#8200da',
  },
]

export function KPIGrid(props: KPIGridProps) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
      gap: '16px',
    }}>
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <div key={card.label} style={kpiStyle}>
            <div style={{ ...iconBoxStyle, background: card.bg, color: card.color }}>
              <Icon size={20} />
            </div>
            <div>
              <div style={labelStyle}>{card.label}</div>
              <div style={valueStyle}>{card.getValue(props)}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
