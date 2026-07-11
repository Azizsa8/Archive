import { useState, useRef, useCallback } from 'react'
import { Mic, Square, Trash2, Loader2 } from 'lucide-react'
import { api } from '../lib/api'

interface VoiceRecorderProps {
  sessionId: string
  onRecordingComplete: (mediaId: string, url: string) => void
}

export function VoiceRecorder({ sessionId, onRecordingComplete }: VoiceRecorderProps) {
  const [state, setState] = useState<'idle' | 'recording' | 'uploading'>('idle')
  const [duration, setDuration] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval>>()

  const cleanup = useCallback(() => {
    clearInterval(timerRef.current)
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    mediaRecorderRef.current = null
    chunksRef.current = []
    setDuration(0)
  }, [])

  const startRecording = useCallback(async () => {
    chunksRef.current = []
    setDuration(0)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const file = new File([blob], `voice-${Date.now()}.webm`, { type: 'audio/webm' })

        setState('uploading')
        try {
          const result = await api.media.upload(file, sessionId, 'Voice note')
          onRecordingComplete(result.id, result.url)
        } catch {
          // toast handled by parent
        } finally {
          cleanup()
          setState('idle')
        }
      }

      recorder.start(250)
      mediaRecorderRef.current = recorder
      setState('recording')

      timerRef.current = setInterval(() => {
        setDuration((d) => d + 1)
      }, 1000)
    } catch {
      setState('idle')
    }
  }, [sessionId, onRecordingComplete, cleanup])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
  }, [])

  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.ondataavailable = null
      mediaRecorderRef.current.onstop = null
      mediaRecorderRef.current.stop()
    }
    cleanup()
    setState('idle')
  }, [cleanup])

  if (state === 'uploading') {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        padding: '8px 16px', borderRadius: '8px',
        background: 'rgba(254, 110, 0, 0.08)',
        fontSize: '0.8125rem', color: 'var(--primary)',
      }}>
        <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
        Uploading voice note...
      </div>
    )
  }

  if (state === 'recording') {
    const mins = Math.floor(duration / 60)
    const secs = duration % 60
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '8px 16px', borderRadius: '8px',
        background: 'rgba(251, 44, 54, 0.08)',
      }}>
        <div style={{
          width: 10, height: 10, borderRadius: '50%',
          background: 'var(--danger)',
          animation: 'pulse 1s ease-in-out infinite',
        }} />
        <span style={{
          fontSize: '0.875rem', fontWeight: 600,
          color: 'var(--danger)', fontVariantNumeric: 'tabular-nums',
          minWidth: '48px',
        }}>
          {mins}:{secs.toString().padStart(2, '0')}
        </span>
        <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'rgba(251,44,54,0.15)', overflow: 'hidden' }}>
          <div style={{
            width: `${(duration % 10) * 10}%`, height: '100%',
            background: 'var(--danger)',
            borderRadius: 2,
            transition: 'width 0.25s linear',
          }} />
        </div>
        <button
          onClick={stopRecording}
          style={{
            background: 'var(--danger)', color: 'white', border: 'none',
            width: 32, height: 32, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <Square size={12} />
        </button>
        <button
          onClick={cancelRecording}
          style={{
            background: 'transparent', color: 'var(--on-surface-muted)', border: 'none',
            width: 32, height: 32, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <Trash2 size={14} />
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={startRecording}
      title="Record voice note"
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
      <Mic size={18} />
    </button>
  )
}
