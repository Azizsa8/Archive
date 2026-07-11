import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { api } from '../lib/api'
import { toast } from 'sonner'
import { Users as UsersIcon, Plus, Trash2 } from 'lucide-react'

interface UserRow {
  id: string
  username: string
  display_name: string
  role: string
  is_active: boolean
  created_at: string
}

export function UsersPage() {
  const { user } = useAuth()
  const [users, setUsers] = useState<UserRow[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [newUser, setNewUser] = useState({ username: '', password: '', displayName: '', role: 'user' })

  const loadUsers = async () => {
    try {
      const res = await api.users.list()
      setUsers(res.data)
    } catch {
      toast.error('Failed to load users')
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newUser.username || !newUser.password) {
      toast.error('Username and password are required')
      return
    }
    try {
      await api.users.create(newUser)
      toast.success('User created')
      setShowCreate(false)
      setNewUser({ username: '', password: '', displayName: '', role: 'user' })
      loadUsers()
    } catch (err: any) {
      toast.error(err.message || 'Failed to create user')
    }
  }

  const handleDelete = async (id: string, username: string) => {
    if (!confirm(`Delete user "${username}"? This cannot be undone.`)) return
    try {
      await api.users.delete(id)
      toast.success('User deleted')
      loadUsers()
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete user')
    }
  }

  if (user?.role !== 'admin') {
    return <div style={{ padding: 'var(--sp-2xl)', color: 'var(--on-surface-muted)' }}>Access denied. Admin only.</div>
  }

  return (
    <div style={{ padding: 'var(--sp-2xl) var(--sp-3xl)' }}>
      <div style={{ maxWidth: 'var(--container-max)', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-xl)' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--on-surface)', marginBottom: 4 }}>
              Users
            </h1>
            <p style={{ color: 'var(--on-surface-muted)', fontSize: '0.875rem' }}>
              Manage user accounts and access
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', borderRadius: 8,
              border: 'none', background: 'var(--primary)',
              color: 'var(--on-primary)', fontSize: '0.875rem',
              fontWeight: 600, cursor: 'pointer',
            }}
          >
            <Plus size={16} />
            Add User
          </button>
        </div>

        {showCreate && (
          <div style={{
            marginBottom: 'var(--sp-xl)',
            padding: 'var(--sp-lg)',
            background: 'var(--surface-elevated)',
            border: '1px solid var(--outline)',
            borderRadius: 12,
          }}>
            <h3 style={{ marginBottom: 16, fontSize: '0.9375rem', fontWeight: 600 }}>Create New User</h3>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 400 }}>
              <input
                placeholder="Username"
                value={newUser.username}
                onChange={(e) => setNewUser((p) => ({ ...p, username: e.target.value }))}
                style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid var(--outline)',
                  background: 'var(--surface)', color: 'var(--on-surface)', fontSize: '0.875rem' }}
              />
              <input
                type="password"
                placeholder="Password"
                value={newUser.password}
                onChange={(e) => setNewUser((p) => ({ ...p, password: e.target.value }))}
                style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid var(--outline)',
                  background: 'var(--surface)', color: 'var(--on-surface)', fontSize: '0.875rem' }}
              />
              <input
                placeholder="Display Name (optional)"
                value={newUser.displayName}
                onChange={(e) => setNewUser((p) => ({ ...p, displayName: e.target.value }))}
                style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid var(--outline)',
                  background: 'var(--surface)', color: 'var(--on-surface)', fontSize: '0.875rem' }}
              />
              <select
                value={newUser.role}
                onChange={(e) => setNewUser((p) => ({ ...p, role: e.target.value }))}
                style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid var(--outline)',
                  background: 'var(--surface)', color: 'var(--on-surface)', fontSize: '0.875rem' }}
              >
                <option value="user">User</option>
                <option value="operator">Operator</option>
                <option value="admin">Admin</option>
              </select>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" style={{
                  padding: '8px 16px', borderRadius: 8, border: 'none',
                  background: 'var(--primary)', color: 'var(--on-primary)',
                  fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer',
                }}>
                  Create
                </button>
                <button type="button" onClick={() => setShowCreate(false)} style={{
                  padding: '8px 16px', borderRadius: 8, border: '1px solid var(--outline)',
                  background: 'transparent', color: 'var(--on-surface)',
                  fontSize: '0.875rem', cursor: 'pointer',
                }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--outline)',
          borderRadius: 12, overflow: 'hidden',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--outline)' }}>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--on-surface-muted)', textTransform: 'uppercase' }}>Username</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--on-surface-muted)', textTransform: 'uppercase' }}>Display Name</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--on-surface-muted)', textTransform: 'uppercase' }}>Role</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--on-surface-muted)', textTransform: 'uppercase' }}>Status</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--on-surface-muted)', textTransform: 'uppercase' }}>Created</th>
                <th style={{ textAlign: 'right', padding: '12px 16px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--on-surface-muted)', textTransform: 'uppercase' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--outline-light)' }}>
                  <td style={{ padding: '12px 16px', fontSize: '0.875rem', fontWeight: 500, color: 'var(--on-surface)' }}>{u.username}</td>
                  <td style={{ padding: '12px 16px', fontSize: '0.875rem', color: 'var(--on-surface)' }}>{u.display_name || '-'}</td>
                  <td style={{ padding: '12px 16px', fontSize: '0.875rem' }}>
                    <span style={{
                      padding: '2px 8px', borderRadius: 4, fontSize: '0.75rem', fontWeight: 600,
                      background: u.role === 'admin' ? 'rgba(254,110,0,0.1)' : 'rgba(255,255,255,0.05)',
                      color: u.role === 'admin' ? 'var(--primary)' : 'var(--on-surface-muted)',
                      textTransform: 'capitalize',
                    }}>
                      {u.role}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '0.875rem' }}>
                    <span style={{
                      display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
                      background: u.is_active ? 'var(--success)' : 'var(--danger)',
                      marginRight: 6,
                    }} />
                    {u.is_active ? 'Active' : 'Inactive'}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '0.8125rem', color: 'var(--on-surface-muted)' }}>
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    {u.id !== '00000000-0000-0000-0000-000000000001' && (
                      <button
                        onClick={() => handleDelete(u.id, u.username)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error)', padding: 4 }}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
