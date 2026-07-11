import { BookOpen } from 'lucide-react'

export function KnowledgeBase() {
  return (
    <div style={{ padding: '32px 40px' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--on-surface)', marginBottom: '4px' }}>
        Knowledge Base
      </h1>
      <p style={{ color: 'var(--on-surface-muted)', fontSize: '0.875rem', marginBottom: '32px' }}>
        Browse embedded chunks and vector search results
      </p>
      <div style={{
        textAlign: 'center',
        padding: '64px 24px',
        color: 'var(--on-surface-muted)',
        background: 'var(--surface-elevated)',
        border: '1px solid var(--outline)',
        borderRadius: '12px',
      }}>
        <BookOpen size={40} style={{ marginBottom: '16px', opacity: 0.4 }} />
        <p style={{ fontWeight: 500 }}>Knowledge Base browser coming soon</p>
      </div>
    </div>
  )
}
