import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Send, Sparkles, BookOpen, MessageSquare,
  FileText, Image, Video, Music, Download, Plus,
  PanelLeftClose, PanelLeft, Loader2
} from 'lucide-react'
import { VoiceRecorder } from '../components/VoiceRecorder'
import { FileAttachments } from '../components/FileAttachments'
import { api } from '../lib/api'
import { getActiveSessionId, setActiveSessionId, clearActiveSessionId } from '../lib/auth'
import { toast } from 'sonner'
import type { SessionInfo, SessionMessage, ToolInfo } from '../types/auth'

interface MediaItem {
  id: string
  url: string
  type: string
  name: string
}

interface ChatMessage {
  id: string
  role: 'user' | 'ai'
  type: 'greeting' | 'text' | 'media'
  content?: string
  media?: MediaItem[]
  citations?: { id: string; name: string }[]
}

export function Chat() {
  const [query, setQuery] = useState('')
  const [pendingAttachments, setPendingAttachments] = useState<MediaItem[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'greeting',
      role: 'ai',
      type: 'greeting',
      content: 'Welcome to Jana-LM Command Center. Record voice notes, attach files, or type a question to get started.'
    }
  ])
  const [isProcessing, setIsProcessing] = useState(false)
  const [pollingSessionId, setPollingSessionId] = useState<string | null>(null)
  const [lastMessageCount, setLastMessageCount] = useState(0)
  const [sessions, setSessions] = useState<SessionInfo[]>([])
  const [activeSessionId, setActiveSessionIdState] = useState<string | null>(getActiveSessionId)
  const [showSessionPanel, setShowSessionPanel] = useState(true)
  const [tools, setTools] = useState<ToolInfo[]>([])
  const [editingTitle, setEditingTitle] = useState<string | null>(null)
  const [titleDraft, setTitleDraft] = useState('')

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const editingInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    loadSessions()
    loadTools()
  }, [])

  useEffect(() => {
    if (activeSessionId) {
      loadSessionMessages(activeSessionId)
    }
  }, [activeSessionId])

  useEffect(() => {
    if (!pollingSessionId) return
    const interval = setInterval(async () => {
      try {
        const res = await api.sessions.get(pollingSessionId)
        if (res.messages.length > lastMessageCount) {
          const newMsgs = res.messages.slice(lastMessageCount)
          const aiNewMsgs = newMsgs.filter((m: SessionMessage) => m.role === 'assistant')
          if (aiNewMsgs.length > 0) {
            setMessages((prev) => {
              const existingIds = new Set(prev.map((m) => m.id))
              const toAdd = res.messages
                .filter((m: SessionMessage) => !existingIds.has(m.id) && m.role === 'assistant')
                .map((m: SessionMessage) => ({
                  id: m.id,
                  role: 'ai' as const,
                  type: 'text' as const,
                  content: m.content || undefined,
                  citations: m.metadata?.citations || undefined,
                }))
              return [...prev, ...toAdd]
            })
            setPollingSessionId(null)
            setIsProcessing(false)
          }
        }
      } catch {
        // poll silently
      }
    }, 2000)
    return () => clearInterval(interval)
  }, [pollingSessionId, lastMessageCount])

  const loadSessions = async () => {
    try {
      const res = await api.sessions.list()
      setSessions(res.data)
      if (!activeSessionId && res.data.length > 0) {
        switchSession(res.data[0].id)
      }
    } catch {
      // not critical on load
    }
  }

  const loadSessionMessages = async (id: string) => {
    try {
      const res = await api.sessions.get(id)
      if (res.messages.length === 0) return

      const loaded: ChatMessage[] = res.messages.map((m: SessionMessage) => ({
        id: m.id,
        role: m.role === 'user' ? 'user' as const : 'ai' as const,
        type: 'text' as const,
        content: m.content || undefined,
        citations: m.metadata?.citations || undefined,
      }))

      setMessages([
        {
          id: 'greeting',
          role: 'ai',
          type: 'greeting',
          content: `Continuing session. You have ${loaded.length} previous messages.`
        },
        ...loaded,
      ])
    } catch {
      console.warn('Could not load session messages')
    }
  }

  const loadTools = async () => {
    try {
      const res = await api.tools.list()
      setTools(res.data)
    } catch {
      // tools not critical
    }
  }

  const switchSession = (id: string) => {
    setActiveSessionId(id)
    setActiveSessionIdState(id)
    setMessages([
      {
        id: 'greeting',
        role: 'ai',
        type: 'greeting',
        content: 'Welcome to Jana-LM Command Center. Record voice notes, attach files, or type a question to get started.'
      }
    ])
  }

  const createSession = async () => {
    try {
      const session = await api.sessions.create('New Chat')
      setSessions((prev) => [session, ...prev])
      switchSession(session.id)
      toast.success('New session created')
    } catch {
      toast.error('Failed to create session')
    }
  }

  const deleteSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await api.sessions.delete(id)
      setSessions((prev) => prev.filter((s) => s.id !== id))
      if (activeSessionId === id) {
        clearActiveSessionId()
        setActiveSessionIdState(null)
        setMessages([
          {
            id: 'greeting',
            role: 'ai',
            type: 'greeting',
            content: 'Welcome to Jana-LM Command Center. Record voice notes, attach files, or type a question to get started.'
          }
        ])
      }
    } catch {
      toast.error('Failed to delete session')
    }
  }

  const startTitleEdit = (id: string, currentTitle: string) => {
    setEditingTitle(id)
    setTitleDraft(currentTitle)
    setTimeout(() => editingInputRef.current?.focus(), 50)
  }

  const saveTitle = async (id: string) => {
    if (!titleDraft.trim()) return
    try {
      await api.sessions.update(id, { title: titleDraft.trim() })
      setSessions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, title: titleDraft.trim() } : s))
      )
    } catch {
      toast.error('Failed to update title')
    }
    setEditingTitle(null)
  }

  const handleAttachmentComplete = useCallback((mediaId: string, url: string, mime: string) => {
    const name = decodeURIComponent(url.split('/').pop() || 'file')
    setPendingAttachments((prev) => [...prev, { id: mediaId, url, type: mime, name }])
  }, [])

  const handleSend = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if ((!query.trim() && pendingAttachments.length === 0) || !activeSessionId) {
      if (!activeSessionId) toast.error('Please create or select a session first')
      return
    }

    const media = [...pendingAttachments]
    const text = query.trim()

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      type: media.length > 0 ? 'media' : 'text',
      content: text || undefined,
      media: media.length > 0 ? media : undefined,
    }

    setMessages((prev) => [...prev, userMsg])
    setQuery('')
    setPendingAttachments([])
    setIsProcessing(true)

    try {
      const mediaIds = media.map((m) => m.id)
      await api.sessions.sendMessage(activeSessionId, text, mediaIds)

      const countRes = await api.sessions.get(activeSessionId)
      setLastMessageCount(countRes.messages.length)

      setPollingSessionId(activeSessionId)
      setSessions((prev) =>
        prev.map((s) => (s.id === activeSessionId ? { ...s, updated_at: new Date().toISOString() } : s))
      )
    } catch (err: any) {
      toast.error(err.message || 'Failed to send message')
      setIsProcessing(false)
    }
  }, [query, pendingAttachments, activeSessionId])

  const handleToolClick = async (tool: ToolInfo) => {
    if (!activeSessionId) {
      toast.error('Please create a session first')
      return
    }

    setIsProcessing(true)
    setMessages((prev) => [
      ...prev,
      {
        id: `msg-${Date.now()}-tool`,
        role: 'user',
        type: 'text',
        content: `🛠️ Running tool: ${tool.name}`,
      },
    ])

    try {
      const res = await api.tools.execute(tool.id, { query: query || 'general' })

      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}-tool-resp`,
          role: 'ai',
          type: 'text',
          content: res.success
            ? `**${tool.name}** result:\n\n${res.output}`
            : `**${tool.name}** failed:\n\n${res.error}`,
        },
      ])
    } catch (err: any) {
      toast.error(err.message || 'Tool execution failed')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      {showSessionPanel && (
        <div style={{
          width: 260,
          borderRight: '1px solid var(--outline)',
          display: 'flex', flexDirection: 'column',
          background: 'var(--surface)',
          flexShrink: 0,
        }}>
          <div style={{
            padding: 'var(--sp-md) var(--sp-lg)',
            borderBottom: '1px solid var(--outline)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ fontWeight: 600, fontSize: '0.8125rem', textTransform: 'uppercase', letterSpacing: '0.03em', color: 'var(--on-surface-muted)' }}>
              Sessions
            </span>
            <button onClick={createSession} style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '4px 10px', borderRadius: 6,
              border: '1px solid var(--outline)',
              background: 'transparent', color: 'var(--primary)',
              fontSize: '0.8125rem', cursor: 'pointer', fontWeight: 500,
            }}>
              <Plus size={14} />
              New
            </button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {sessions.map((session) => (
              <div
                key={session.id}
                onClick={() => switchSession(session.id)}
                style={{
                  padding: '10px var(--sp-lg)',
                  cursor: 'pointer',
                  borderLeft: activeSessionId === session.id ? '3px solid var(--primary)' : '3px solid transparent',
                  background: activeSessionId === session.id ? 'rgba(254,110,0,0.04)' : 'transparent',
                }}
              >
                {editingTitle === session.id ? (
                  <input
                    ref={editingInputRef}
                    value={titleDraft}
                    onChange={(e) => setTitleDraft(e.target.value)}
                    onBlur={() => saveTitle(session.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveTitle(session.id)
                      if (e.key === 'Escape') setEditingTitle(null)
                    }}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      width: '100%', padding: '2px 4px',
                      fontSize: '0.8125rem', border: '1px solid var(--primary)',
                      borderRadius: 4, background: 'var(--surface-elevated)',
                      color: 'var(--on-surface)',
                    }}
                  />
                ) : (
                  <div
                    style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--on-surface)', marginBottom: 2 }}
                    onDoubleClick={() => startTitleEdit(session.id, session.title || '')}
                  >
                    {session.title || 'Untitled'}
                  </div>
                )}
                <div style={{ fontSize: '0.6875rem', color: 'var(--on-surface-muted)' }}>
                  {new Date(session.updated_at).toLocaleDateString()}
                </div>
              </div>
            ))}
            {sessions.length === 0 && (
              <div style={{ padding: 'var(--sp-lg)', textAlign: 'center', color: 'var(--on-surface-muted)', fontSize: '0.8125rem' }}>
                No sessions yet. Click "New" to start.
              </div>
            )}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '8px var(--sp-xl)',
          borderBottom: '1px solid var(--outline)',
          background: 'var(--surface)',
        }}>
          <button
            onClick={() => setShowSessionPanel(!showSessionPanel)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--on-surface-muted)', display: 'flex', padding: 4 }}
          >
            {showSessionPanel ? <PanelLeftClose size={18} /> : <PanelLeft size={18} />}
          </button>

          {tools.length > 0 && (
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--on-surface-muted)', fontWeight: 500 }}>Tools:</span>
              {tools.map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => handleToolClick(tool)}
                  title={tool.description}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    padding: '4px 10px', borderRadius: 6,
                    border: '1px solid var(--outline)',
                    background: 'transparent', color: 'var(--on-surface)',
                    fontSize: '0.75rem', cursor: 'pointer', fontWeight: 500,
                    transition: 'all 150ms',
                  }}
                >
                  {tool.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--sp-2xl) var(--sp-3xl)' }}>
          <div style={{
            maxWidth: 'var(--container-max)',
            margin: '0 auto',
            display: 'flex', flexDirection: 'column', gap: 'var(--sp-lg)',
          }}>
            {messages.map((msg) => (
              <div key={msg.id} style={{
                display: 'flex', maxWidth: '800px',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                marginLeft: msg.role === 'user' ? 'auto' : undefined,
              }}>
                {msg.type === 'greeting' && (
                  <div className="message-card greeting-card">
                    <div className="message-avatar">
                      <BookOpen size={18} />
                    </div>
                    <p>{msg.content}</p>
                  </div>
                )}

                {msg.role === 'user' && (msg.type === 'text' || msg.type === 'media') && (
                  <div style={{ maxWidth: '560px' }}>
                    <div className="message-card user-card">
                      {msg.content && <p>{msg.content}</p>}
                      {msg.media && msg.media.length > 0 && (
                        <div style={{ marginTop: msg.content ? '10px' : 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {msg.media.map((m) => (
                            <MediaRenderer key={m.id} media={m} />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {msg.role === 'ai' && msg.type === 'text' && msg.content && (
                  <div className="message-card ai-card">
                    <div className="message-avatar">
                      <Sparkles size={18} />
                    </div>
                    <p style={{ whiteSpace: 'pre-line', lineHeight: 1.8 }}>{msg.content}</p>
                    {msg.citations && msg.citations.length > 0 && (
                      <div className="citations">
                        <span className="citations-label">Sources:</span>
                        <div className="citations-list">
                          {msg.citations.map((cite, i) => (
                            <div key={i} className="citation-chip">
                              <FileText size={14} />
                              {cite.name}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {isProcessing && (
              <div style={{
                display: 'flex', maxWidth: '800px', justifyContent: 'flex-start',
              }}>
                <div className="message-card ai-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Loader2 size={16} style={{ animation: 'spin 1s linear infinite', color: 'var(--primary)' }} />
                    <span style={{ color: 'var(--on-surface-muted)', fontSize: '0.875rem' }}>
                      Processing through n8n...
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="input-area">
          <div className="input-section">
            {pendingAttachments.length > 0 && (
              <div style={{
                display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px',
              }}>
                {pendingAttachments.map((att) => (
                  <div key={att.id} style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '4px 10px', borderRadius: '8px',
                    background: 'var(--surface)',
                    border: '1px solid var(--outline)',
                    fontSize: '0.8125rem',
                  }}>
                    <FileText size={14} style={{ color: 'var(--primary)' }} />
                    <span style={{ color: 'var(--on-surface)', fontWeight: 500 }}>
                      {att.name.length > 30 ? att.name.slice(0, 30) + '...' : att.name}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <form className="input-bar" onSubmit={handleSend}>
              <VoiceRecorder
                sessionId={activeSessionId || ''}
                onRecordingComplete={handleAttachmentComplete}
              />
              <FileAttachments
                sessionId={activeSessionId || ''}
                onAttachmentComplete={handleAttachmentComplete}
              />
              <input
                type="text"
                placeholder={activeSessionId ? "Type a message, record voice, or drop files..." : "Create a session first..."}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                style={{ flex: 1 }}
              />
              <button
                type="submit"
                className="send-btn"
                disabled={(!query.trim() && pendingAttachments.length === 0) || !activeSessionId}
                style={{
                  opacity: (!query.trim() && pendingAttachments.length === 0) || !activeSessionId ? 0.5 : 1,
                  cursor: (!query.trim() && pendingAttachments.length === 0) || !activeSessionId ? 'not-allowed' : 'pointer',
                }}
              >
                <Send size={18} />
              </button>
            </form>

            <div className="suggested">
              <button
                className="suggested-chip"
                onClick={() => setQuery('What documents do I have in my knowledge base?')}
              >
                <MessageSquare size={14} />
                Browse my documents
              </button>
              <button
                className="suggested-chip"
                onClick={() => setQuery('Summarize the latest documents')}
              >
                <MessageSquare size={14} />
                Summarize documents
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function MediaRenderer({ media }: { media: MediaItem }) {
  const type = media.type.split('/')[0]

  if (type === 'image') {
    return (
      <img
        src={media.url}
        alt={media.name}
        style={{
          maxWidth: '100%', maxHeight: 400, borderRadius: '8px',
          objectFit: 'contain', background: 'var(--surface)',
          marginTop: '8px', cursor: 'pointer',
        }}
        onClick={() => window.open(media.url, '_blank')}
      />
    )
  }

  if (type === 'video') {
    return (
      <video
        controls
        style={{ maxWidth: '100%', maxHeight: 400, borderRadius: '8px', marginTop: '8px' }}
        src={media.url}
      >
        Your browser does not support video playback.
      </video>
    )
  }

  if (type === 'audio') {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        marginTop: '8px', padding: '10px 14px',
        background: 'rgba(254,110,0,0.06)',
        border: '1px solid rgba(254,110,0,0.15)',
        borderRadius: '8px',
      }}>
        <Music size={18} style={{ color: 'var(--primary)', flexShrink: 0 }} />
        <audio controls style={{ flex: 1, height: 36 }} src={media.url}>
          Your browser does not support audio playback.
        </audio>
        <a
          href={media.url}
          download={media.name}
          style={{
            color: 'var(--on-surface-muted)', flexShrink: 0,
            display: 'flex', padding: '4px',
          }}
          title="Download"
        >
          <Download size={16} />
        </a>
      </div>
    )
  }

  return (
    <a
      href={media.url}
      download={media.name}
      style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        marginTop: '8px', padding: '10px 14px',
        background: 'var(--surface)', border: '1px solid var(--outline)',
        borderRadius: '8px', textDecoration: 'none',
        color: 'var(--on-surface)', fontSize: '0.875rem',
        fontWeight: 500,
      }}
    >
      <FileText size={18} style={{ color: 'var(--primary)', flexShrink: 0 }} />
      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {media.name}
      </span>
      <Download size={16} style={{ color: 'var(--on-surface-muted)', flexShrink: 0 }} />
    </a>
  )
}
