import { History } from 'lucide-react'

export function ConversationsPage() {
  return (
    <div style={{ padding: '32px 40px' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--on-surface)', marginBottom: '4px' }}>
        Conversations
      </h1>
      <p style={{ color: 'var(--on-surface-muted)', fontSize: '0.875rem', marginBottom: '32px' }}>
        Query history and analytics
      </p>
      <div style={{
        textAlign: 'center',
        padding: '64px 24px',
        color: 'var(--on-surface-muted)',
        background: 'var(--surface-elevated)',
        border: '1px solid var(--outline)',
        borderRadius: '12px',
      }}>
        <History size={40} style={{ marginBottom: '16px', opacity: 0.4 }} />
        <p style={{ fontWeight: 500 }}>Conversation log coming soon</p>
      </div>
    </div>
  )
}
