import { GitBranch } from 'lucide-react'

export function Workflows() {
  return (
    <div style={{ padding: '32px 40px' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--on-surface)', marginBottom: '4px' }}>
        Workflows
      </h1>
      <p style={{ color: 'var(--on-surface-muted)', fontSize: '0.875rem', marginBottom: '32px' }}>
        n8n workflow status and execution logs
      </p>
      <div style={{
        textAlign: 'center',
        padding: '64px 24px',
        color: 'var(--on-surface-muted)',
        background: 'var(--surface-elevated)',
        border: '1px solid var(--outline)',
        borderRadius: '12px',
      }}>
        <GitBranch size={40} style={{ marginBottom: '16px', opacity: 0.4 }} />
        <p style={{ fontWeight: 500 }}>Workflow viewer coming soon</p>
      </div>
    </div>
  )
}
