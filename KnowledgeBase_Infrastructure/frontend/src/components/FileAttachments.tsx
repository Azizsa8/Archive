import { useState, useRef, useCallback, type DragEvent } from 'react'
import { Paperclip, X, FileText, Image, Video, Music, FileUp, Loader2 } from 'lucide-react'
import { api } from '../lib/api'

interface Attachment {
  id: string
  file: File
  preview?: string
  uploading: boolean
  uploadedId?: string
  url?: string
}

interface FileAttachmentsProps {
  sessionId: string
  onAttachmentComplete: (mediaId: string, url: string, type: string) => void
}

const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB

function getFileIcon(mime: string) {
  if (mime.startsWith('image/')) return Image
  if (mime.startsWith('video/')) return Video
  if (mime.startsWith('audio/')) return Music
  return FileText
}

function getFileType(mime: string): string {
  if (mime.startsWith('image/')) return 'image'
  if (mime.startsWith('video/')) return 'video'
  if (mime.startsWith('audio/')) return 'audio'
  return 'document'
}

export function FileAttachments({ sessionId, onAttachmentComplete }: FileAttachmentsProps) {
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropRef = useRef<HTMLDivElement>(null)

  const uploadFile = useCallback(async (att: Attachment) => {
    setAttachments((prev) =>
      prev.map((a) => (a.id === att.id ? { ...a, uploading: true } : a))
    )

    try {
      const result = await api.media.upload(att.file, sessionId)
      onAttachmentComplete(result.id, result.url, att.file.type)
      setAttachments((prev) =>
        prev.map((a) =>
          a.id === att.id
            ? { ...a, uploading: false, uploadedId: result.id, url: result.url }
            : a
        )
      )
    } catch {
      setAttachments((prev) => prev.filter((a) => a.id !== att.id))
    }
  }, [sessionId, onAttachmentComplete])

  const addFiles = useCallback((files: FileList | File[]) => {
    const newAttachments: Attachment[] = Array.from(files)
      .filter((f) => f.size <= MAX_FILE_SIZE)
      .map((file) => ({
        id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        file,
        preview: file.type.startsWith('image/')
          ? URL.createObjectURL(file)
          : undefined,
        uploading: false,
      }))

    setAttachments((prev) => [...prev, ...newAttachments])
    newAttachments.forEach(uploadFile)
  }, [uploadFile])

  const removeAttachment = useCallback((id: string) => {
    setAttachments((prev) => {
      const att = prev.find((a) => a.id === id)
      if (att?.preview) URL.revokeObjectURL(att.preview)
      return prev.filter((a) => a.id !== id)
    })
  }, [])

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files)
    }
  }, [addFiles])

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  return (
    <div ref={dropRef} style={{ position: 'relative' }}>
      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
        style={{ display: 'none' }}
        onChange={(e) => {
          if (e.target.files) addFiles(e.target.files)
          e.target.value = ''
        }}
      />

      {/* Attachment chips */}
      {attachments.length > 0 && (
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: '8px',
          marginBottom: '8px',
        }}>
          {attachments.map((att) => {
            const Icon = getFileIcon(att.file.type)
            return (
              <div key={att.id} style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '4px 8px 4px 10px',
                borderRadius: '8px',
                background: att.uploading
                  ? 'rgba(254, 110, 0, 0.08)'
                  : 'var(--surface)',
                border: '1px solid var(--outline)',
                fontSize: '0.8125rem',
                maxWidth: '240px',
              }}>
                {att.uploading ? (
                  <Loader2 size={14} style={{ animation: 'spin 1s linear infinite', color: 'var(--primary)' }} />
                ) : (
                  <Icon size={14} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                )}
                <span style={{
                  overflow: 'hidden', textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap', color: 'var(--on-surface)',
                  fontWeight: 500,
                }}>
                  {att.file.name}
                </span>
                <button
                  onClick={() => removeAttachment(att.id)}
                  style={{
                    background: 'transparent', border: 'none',
                    color: 'var(--on-surface-muted)', cursor: 'pointer',
                    padding: 2, display: 'flex', flexShrink: 0,
                  }}
                >
                  <X size={12} />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Drag overlay */}
      {isDragging && (
        <div style={{
          position: 'absolute', inset: -8, zIndex: 10,
          background: 'rgba(254,110,0,0.06)',
          border: '2px dashed var(--primary)',
          borderRadius: '12px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: '8px', color: 'var(--primary)', fontWeight: 600,
          fontSize: '0.875rem',
        }}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <FileUp size={20} />
          Drop files here
        </div>
      )}

      {/* Attach button */}
      <button
        onClick={() => inputRef.current?.click()}
        title="Attach file"
        style={{
          background: 'transparent', border: 'none', color: 'var(--on-surface-muted)',
          width: 40, height: 40, borderRadius: '8px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', flexShrink: 0,
          transition: 'all 150ms',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(254,110,0,0.08)'
          e.currentTarget.style.color = 'var(--primary)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent'
          e.currentTarget.style.color = 'var(--on-surface-muted)'
        }}
      >
        <Paperclip size={18} />
      </button>
    </div>
  )
}
