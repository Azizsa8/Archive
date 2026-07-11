import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { toast } from 'sonner'

export function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  if (isAuthenticated) {
    navigate('/', { replace: true })
    return null
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !password.trim()) return

    setLoading(true)
    try {
      await login(username.trim(), password)
      toast.success(`Welcome back, ${username}`)
      navigate('/', { replace: true })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: 'var(--bg)',
    }}>
      <div style={{
        flex: '0 0 480px',
        background: 'linear-gradient(135deg, var(--primary) 0%, #cc5800 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '48px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute',
          top: '-20%',
          right: '-20%',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.06)',
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-30%',
          left: '-10%',
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.04)',
        }} />
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <div style={{
            width: '72px',
            height: '72px',
            background: 'rgba(255,255,255,0.20)',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
          }}>
            <BookOpen size={36} color="white" />
          </div>
          <h1 style={{
            color: 'white',
            fontSize: '2rem',
            fontWeight: 700,
            marginBottom: '8px',
            letterSpacing: '-0.025em',
          }}>
            Jana-LM
          </h1>
          <p style={{
            color: 'rgba(255,255,255,0.80)',
            fontSize: '1rem',
            lineHeight: 1.6,
          }}>
            Command Center
          </p>
        </div>
      </div>

      <div style={{
        flex: 1,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '48px',
      }}>
        <div style={{
          width: '100%',
          maxWidth: '400px',
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            color: 'var(--on-surface)',
            marginBottom: '8px',
          }}>
            Sign in
          </h2>
          <p style={{
            color: 'var(--on-surface-muted)',
            fontSize: '0.9375rem',
            marginBottom: '32px',
          }}>
            Enter your credentials to access the command center
          </p>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '0.8125rem',
                fontWeight: 600,
                color: 'var(--on-surface-muted)',
                marginBottom: '8px',
                letterSpacing: '0.03em',
                textTransform: 'uppercase',
              }}>
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                autoFocus
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  fontSize: '1rem',
                  background: 'var(--surface)',
                  border: '2px solid var(--outline-strong)',
                  borderRadius: '10px',
                  color: 'var(--on-surface)',
                  outline: 'none',
                  transition: 'border-color 150ms ease',
                }}
                onFocus={(e) => { e.target.style.borderColor = 'var(--primary)' }}
                onBlur={(e) => { e.target.style.borderColor = 'var(--outline-strong)' }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '0.8125rem',
                fontWeight: 600,
                color: 'var(--on-surface-muted)',
                marginBottom: '8px',
                letterSpacing: '0.03em',
                textTransform: 'uppercase',
              }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  fontSize: '1rem',
                  background: 'var(--surface)',
                  border: '2px solid var(--outline-strong)',
                  borderRadius: '10px',
                  color: 'var(--on-surface)',
                  outline: 'none',
                  transition: 'border-color 150ms ease',
                }}
                onFocus={(e) => { e.target.style.borderColor = 'var(--primary)' }}
                onBlur={(e) => { e.target.style.borderColor = 'var(--outline-strong)' }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                fontSize: '1rem',
                fontWeight: 600,
                background: loading ? 'var(--primary-strong)' : 'var(--primary)',
                color: 'var(--on-primary)',
                border: 'none',
                borderRadius: '10px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                transition: 'all 150ms ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
