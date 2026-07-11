import { useState } from 'react'
import { FileText, Search, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import { useDocuments, useDeleteDocument } from '../hooks/useDocuments'
import { ErrorBoundary } from '../components/ErrorBoundary'
import { toast } from 'sonner'

function DocumentsInner() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const limit = 20

  const { data, isLoading, error } = useDocuments({ page, limit, search: search || undefined })
  const deleteDoc = useDeleteDocument()

  const handleDelete = (id: string, filename: string) => {
    if (!confirm(`Delete "${filename}"? This cannot be undone.`)) return
    deleteDoc.mutate(id, {
      onSuccess: () => toast.success('Document deleted'),
      onError: (err) => toast.error(err.message),
    })
  }

  const totalPages = data ? Math.ceil(data.total / limit) : 0

  return (
    <div style={{ padding: '32px 40px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--on-surface)', marginBottom: '4px' }}>
          Documents
        </h1>
        <p style={{ color: 'var(--on-surface-muted)', fontSize: '0.875rem' }}>
          Manage your knowledge base documents
        </p>
      </div>

      {/* Search bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        background: 'var(--surface)',
        border: '1px solid var(--outline-strong)',
        borderRadius: '10px',
        padding: '0 16px',
        marginBottom: '20px',
        height: '44px',
      }}>
        <Search size={16} style={{ color: 'var(--on-surface-muted)', flexShrink: 0 }} />
        <input
          type="text"
          placeholder="Search documents..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            color: 'var(--on-surface)',
            fontSize: '0.9375rem',
            outline: 'none',
            height: '100%',
          }}
        />
      </div>

      {isLoading && (
        <div style={{ color: 'var(--on-surface-muted)', padding: '32px 0' }}>Loading documents...</div>
      )}

      {error && (
        <div style={{ color: 'var(--danger)', padding: '32px 0' }}>Error: {error.message}</div>
      )}

      {data && data.data.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '64px 24px',
          color: 'var(--on-surface-muted)',
        }}>
          <FileText size={40} style={{ marginBottom: '16px', opacity: 0.4 }} />
          <p style={{ fontSize: '0.9375rem', fontWeight: 500 }}>No documents found</p>
          <p style={{ fontSize: '0.8125rem', marginTop: '4px' }}>
            {search ? 'Try a different search term' : 'Upload documents to get started'}
          </p>
        </div>
      )}

      {data && data.data.length > 0 && (
        <>
          <div style={{
            background: 'var(--surface-elevated)',
            border: '1px solid var(--outline)',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-subtle)',
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--outline)' }}>
                  {['Name', 'Type', 'Status', 'Size', 'Uploaded', ''].map((h) => (
                    <th key={h} style={{
                      textAlign: 'left',
                      padding: '12px 16px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: 'var(--on-surface-muted)',
                      background: 'var(--surface-soft)',
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.data.map((doc) => (
                  <tr key={doc.id} style={{ borderBottom: '1px solid var(--outline)', transition: 'background 150ms' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-soft)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <FileText size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                        <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--on-surface)' }}>
                          {doc.filename}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '0.8125rem', color: 'var(--on-surface-muted)' }}>
                      {doc.source_type || '—'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span className={`status-badge badge-${doc.status}`}>
                        {doc.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '0.8125rem', color: 'var(--on-surface-muted)' }}>
                      {doc.file_size ? `${(doc.file_size / 1024).toFixed(0)} KB` : '—'}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '0.8125rem', color: 'var(--on-surface-muted)' }}>
                      {new Date(doc.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <button
                        onClick={() => handleDelete(doc.id, doc.filename)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--on-surface-muted)',
                          cursor: 'pointer',
                          padding: '4px',
                          borderRadius: '6px',
                          transition: 'all 150ms',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = 'var(--danger)'
                          e.currentTarget.style.background = 'rgba(251, 44, 54, 0.08)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = 'var(--on-surface-muted)'
                          e.currentTarget.style.background = 'transparent'
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '16px',
            color: 'var(--on-surface-muted)',
            fontSize: '0.8125rem',
          }}>
            <span>
              Showing {((page - 1) * limit) + 1}–{Math.min(page * limit, data.total)} of {data.total}
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="shell-ghost-btn"
                style={{ opacity: page <= 1 ? 0.3 : 1 }}
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="shell-ghost-btn"
                style={{ opacity: page >= totalPages ? 0.3 : 1 }}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export function Documents() {
  return (
    <ErrorBoundary>
      <DocumentsInner />
    </ErrorBoundary>
  )
}
